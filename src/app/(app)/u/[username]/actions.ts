"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { AuthError, requireMember } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

async function member(next: string) {
  try {
    return await requireMember();
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? `/sign-in?next=${encodeURIComponent(next)}` : e.code === "onboarding_required" ? "/onboarding" : "/feed");
    throw e;
  }
}

/** Block: instant, silent, total. The other person is never told. */
export async function blockUser(userId: string, username: string): Promise<void> {
  const session = await member(`/u/${username}`);
  const supabase = await createClient();
  await supabase.from("blocks").insert({ university_id: session.universityId, blocker_id: session.userId, blocked_id: userId });
  revalidatePath("/settings");
  redirect("/feed");
}

export async function unblockUser(userId: string): Promise<void> {
  const session = await member("/settings");
  const supabase = await createClient();
  await supabase.from("blocks").delete().eq("blocker_id", session.userId).eq("blocked_id", userId);
  revalidatePath("/settings");
}

export async function muteUser(userId: string, username: string): Promise<void> {
  const session = await member(`/u/${username}`);
  const supabase = await createClient();
  await supabase.from("mutes").insert({ university_id: session.universityId, muter_id: session.userId, muted_id: userId });
  revalidatePath(`/u/${username}`);
  revalidatePath("/settings");
}

export async function unmuteUser(userId: string, username?: string): Promise<void> {
  const session = await member("/settings");
  const supabase = await createClient();
  await supabase.from("mutes").delete().eq("muter_id", session.userId).eq("muted_id", userId);
  revalidatePath("/settings");
  if (username) revalidatePath(`/u/${username}`);
}
