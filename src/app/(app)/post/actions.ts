"use server";

import { redirect } from "next/navigation";
import { explainDbError } from "@/lib/dal/posts";
import { AuthError, requireMember } from "@/lib/dal/session";
import { POST_TYPE_META, createPostSchema, parsePayload } from "@/lib/posts/types";
import { OPEN_TYPES } from "@/lib/posts/open-types";
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
  if (!OPEN_TYPES.includes(input.type)) return { error: `${meta.plural} open in the next release.` };
  if (!meta.imagesAllowed && input.images.length > 0) return { error: `${meta.plural} do not carry images.` };
  for (const path of input.images) {
    if (!path.startsWith(`${session.universityId}/`)) return { error: "One of the images does not belong to this campus." };
  }

  let payload: unknown = {};
  const rawPayload = formData.get("payload");
  if (typeof rawPayload === "string" && rawPayload.trim()) {
    try {
      payload = JSON.parse(rawPayload);
    } catch {
      return { error: "The extra fields could not be read." };
    }
  }
  const payloadParsed = parsePayload(input.type, payload);
  if (!payloadParsed.success) return { error: payloadParsed.error.issues[0]?.message ?? "Check the extra fields." };

  const days = input.expiresInDays ?? meta.defaultExpiryDays;
  const expiresAt = days ? new Date(Date.now() + days * 86_400_000).toISOString() : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .insert({
      university_id: session.universityId,
      author_id: session.userId,
      space_id: input.spaceId,
      type: input.type,
      title: input.title,
      body: input.body,
      payload: payloadParsed.data as Json,
      images: input.images,
      expires_at: expiresAt,
    })
    .select("id")
    .single();
  if (error || !data) return { error: explainDbError(error?.message ?? "") };
  redirect(`/p/${data.id}`);
}
