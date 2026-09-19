"use server";

import { redirect } from "next/navigation";
import { getCampus, typeEnabled } from "@/lib/dal/campus";
import { currentTerm } from "@/lib/dal/modules";
import { explainDbError } from "@/lib/dal/posts";
import { AuthError, requireMember } from "@/lib/dal/session";
import { payloadFromForm } from "@/lib/posts/payload-from-form";
import { POST_TYPE_META, createPostSchema } from "@/lib/posts/types";
import { findProhibitedItems } from "@/lib/relay/payment-words";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ComposerState = { error?: string };

function redirectFor(e: unknown, next: string): never {
  if (e instanceof AuthError) {
    if (e.code === "signed_out") redirect(`/sign-in?next=${encodeURIComponent(next)}`);
    if (e.code === "onboarding_required") redirect("/onboarding");
    redirect("/feed");
  }
  throw e;
}

export async function createPost(_prev: ComposerState, formData: FormData): Promise<ComposerState> {
  let session: Awaited<ReturnType<typeof requireMember>>;
  try {
    session = await requireMember();
  } catch (e) {
    redirectFor(e, "/post");
  }

  const parsed = createPostSchema.safeParse({
    type: formData.get("type"),
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    spaceId: formData.get("spaceId") || null,
    expiresInDays: formData.get("expiresInDays") || null,
    images: formData.getAll("images").filter((v): v is string => typeof v === "string" && v.length > 0),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form and try again." };
  const input = parsed.data;
  const meta = POST_TYPE_META[input.type];
  const campus = await getCampus();
  if (!campus || !typeEnabled(campus.featureFlags, input.type)) return { error: `${meta.plural} are switched off on this campus.` };
  if (!meta.imagesAllowed && input.images.length > 0) return { error: `${meta.plural} do not carry images.` };
  for (const path of input.images) {
    if (!path.startsWith(`${session.universityId}/`)) return { error: "One of the images does not belong to this campus." };
  }

  const built = payloadFromForm(input.type, formData, campus.timezone);
  if (built.error) return { error: built.error };

  if (input.type === "listing") {
    const hits = findProhibitedItems(`${input.title}\n${input.body}`);
    if (hits.length > 0) return { error: `That cannot be listed here (${hits.join(", ")}). See the marketplace rules.` };
  }

  const supabase = await createClient();
  if (input.type === "meal") {
    if (formData.get("mealAttest") !== "on" || formData.get("mealPolicy") !== "on") return { error: "Tick both meal-sharing statements first." };
    const term = await currentTerm();
    const { error: attestError } = await supabase.from("profiles").update({ meal_plan_attested_term: term, meal_plan_attested_at: new Date().toISOString() }).eq("user_id", session.userId);
    if (attestError) return { error: "Could not record your plan attestation." };
    const { data: policy } = await supabase.from("policy_versions").select("id").eq("slug", "meal-sharing").order("effective_at", { ascending: false }).limit(1).maybeSingle();
    if (policy) await supabase.from("consent_records").insert({ user_id: session.userId, policy_version_id: policy.id, choice: "meal_sharing", accepted: true, context: { term } });
  }

  // Embedding computed on the device (Phase 6): 384 finite numbers or nothing.
  let embedding: string | null = null;
  const rawEmbedding = formData.get("embedding");
  if (typeof rawEmbedding === "string" && rawEmbedding.length > 0) {
    try {
      const v = JSON.parse(rawEmbedding) as unknown;
      if (Array.isArray(v) && v.length === 384 && v.every((n) => typeof n === "number" && Number.isFinite(n))) embedding = JSON.stringify(v);
    } catch {
      embedding = null;
    }
  }

  const days = input.expiresInDays ?? meta.defaultExpiryDays;
  const expiresAt = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;

  const { data, error } = await supabase
    .from("posts")
    .insert({
      university_id: session.universityId,
      author_id: session.userId,
      space_id: input.spaceId,
      type: input.type,
      audience: built.audience,
      title: input.title,
      body: input.body,
      payload: built.payload as Json,
      images: input.images,
      expires_at: expiresAt,
      embedding,
    })
    .select("id")
    .single();
  if (error || !data) return { error: explainDbError(error?.message ?? "") };
  redirect(`/p/${data.id}`);
}
