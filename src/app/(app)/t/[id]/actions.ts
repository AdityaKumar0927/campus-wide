"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { explainDbError } from "@/lib/dal/posts";
import { AuthError, requireMember } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

export type MessageState = { error?: string; ok?: boolean };

async function member(threadId: string) {
  try {
    return await requireMember();
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? `/sign-in?next=${encodeURIComponent(`/t/${threadId}`)}` : e.code === "onboarding_required" ? "/onboarding" : "/feed");
    throw e;
  }
}

export async function sendMessage(threadId: string, _prev: MessageState, formData: FormData): Promise<MessageState> {
  const session = await member(threadId);
  const body = String(formData.get("body") ?? "").trim();
  if (body.length < 1) return { error: "Write something first." };
  if (body.length > 2000) return { error: "Keep it under 2,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase.from("relay_messages").insert({ university_id: session.universityId, thread_id: threadId, sender_id: session.userId, body });
  if (error) return { error: explainDbError(error.message) };
  revalidatePath(`/t/${threadId}`);
  return { ok: true };
}

export async function setShareEmail(threadId: string, role: "initiator" | "owner", share: boolean): Promise<void> {
  await member(threadId);
  const supabase = await createClient();
  const patch = role === "initiator" ? { initiator_share_email: share } : { owner_share_email: share };
  const { error } = await supabase.from("relay_threads").update(patch).eq("id", threadId);
  if (error) throw new Error(explainDbError(error.message));
  revalidatePath(`/t/${threadId}`);
}

export async function confirmHappened(threadId: string, role: "initiator" | "owner"): Promise<void> {
  await member(threadId);
  const supabase = await createClient();
  const now = new Date().toISOString();
  const patch = role === "initiator" ? { initiator_confirmed_at: now } : { owner_confirmed_at: now };
  const { error } = await supabase.from("relay_threads").update(patch).eq("id", threadId);
  if (error) throw new Error(explainDbError(error.message));
  revalidatePath(`/t/${threadId}`);
}

export async function closeThread(threadId: string): Promise<void> {
  await member(threadId);
  const supabase = await createClient();
  await supabase.from("relay_threads").update({ state: "closed" }).eq("id", threadId);
  revalidatePath(`/t/${threadId}`);
  revalidatePath("/threads");
}

/** Block is instant, silent, and total (pilot §4). The thread freezes for both; history stays for reports. */
export async function blockOther(threadId: string, otherId: string): Promise<void> {
  const session = await member(threadId);
  const supabase = await createClient();
  await supabase.from("blocks").insert({ university_id: session.universityId, blocker_id: session.userId, blocked_id: otherId });
  redirect("/threads");
}
