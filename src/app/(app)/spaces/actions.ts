"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { explainDbError } from "@/lib/dal/posts";
import { AuthError, requireMember } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/text";

export type SpaceFormState = { error?: string };

async function member(next: string) {
  try {
    return await requireMember();
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? `/sign-in?next=${encodeURIComponent(next)}` : e.code === "onboarding_required" ? "/onboarding" : "/feed");
    throw e;
  }
}

export async function joinSpace(spaceId: string, slug: string): Promise<void> {
  const session = await member(`/s/${slug}`);
  const supabase = await createClient();
  await supabase.from("space_memberships").insert({ university_id: session.universityId, space_id: spaceId, user_id: session.userId });
  revalidatePath("/spaces");
  revalidatePath(`/s/${slug}`);
}

export async function leaveSpace(spaceId: string, slug: string): Promise<void> {
  const session = await member(`/s/${slug}`);
  const supabase = await createClient();
  await supabase.from("space_memberships").delete().eq("space_id", spaceId).eq("user_id", session.userId);
  revalidatePath("/spaces");
  revalidatePath(`/s/${slug}`);
}

const spaceSchema = z.object({
  name: z.string().trim().min(3, "Give the space a name.").max(60, "Keep the name under 60 characters."),
  description: z.string().trim().max(300).default(""),
  kind: z.enum(["course", "residence", "club", "interest"]).default("interest"),
});

export async function createSpace(_prev: SpaceFormState, formData: FormData): Promise<SpaceFormState> {
  const session = await member("/spaces");
  const parsed = spaceSchema.safeParse({ name: formData.get("name"), description: formData.get("description") ?? "", kind: formData.get("kind") ?? "interest" });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const slug = slugify(parsed.data.name);
  if (slug.length < 2) return { error: "Use a few letters or numbers in the name." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("spaces")
    .insert({ university_id: session.universityId, slug, name: parsed.data.name, description: parsed.data.description || null, kind: parsed.data.kind, created_by: session.userId })
    .select("id")
    .single();
  if (error || !data) return { error: /duplicate|unique/i.test(error?.message ?? "") ? "A space with that name already exists." : explainDbError(error?.message ?? "") };
  await supabase.from("space_memberships").insert({ university_id: session.universityId, space_id: data.id, user_id: session.userId, role: "organizer" });
  redirect(`/s/${slug}`);
}
