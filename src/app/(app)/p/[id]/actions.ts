"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { explainDbError } from "@/lib/dal/posts";
import { AuthError, requireMember } from "@/lib/dal/session";
import { commentSchema } from "@/lib/posts/types";
import { createClient } from "@/lib/supabase/server";

export type CommentState = { error?: string; ok?: boolean };

async function member(next: string) {
  try {
    return await requireMember();
  } catch (e) {
    if (e instanceof AuthError) {
      if (e.code === "signed_out") redirect(`/sign-in?next=${encodeURIComponent(next)}`);
      if (e.code === "onboarding_required") redirect("/onboarding");
      redirect("/feed");
    }
    throw e;
  }
}

export async function addComment(postId: string, _prev: CommentState, formData: FormData): Promise<CommentState> {
  const session = await member(`/p/${postId}`);
  const parsed = commentSchema.safeParse({ body: formData.get("body"), parentId: formData.get("parentId") || null });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };
  const supabase = await createClient();
  const { error } = await supabase.from("comments").insert({
    university_id: session.universityId,
    post_id: postId,
    author_id: session.userId,
    parent_id: parsed.data.parentId,
    body: parsed.data.body,
  });
  if (error) return { error: explainDbError(error.message) };
  revalidatePath(`/p/${postId}`);
  return { ok: true };
}

export async function acceptAnswer(postId: string, commentId: string): Promise<void> {
  await member(`/p/${postId}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_answer", { p_comment_id: commentId });
  if (error) throw new Error(explainDbError(error.message));
  revalidatePath(`/p/${postId}`);
}

export async function toggleThanks(postId: string, targetType: "post" | "comment", targetId: string): Promise<boolean> {
  await member(`/p/${postId}`);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("toggle_thanks", { p_target_type: targetType, p_target_id: targetId });
  if (error) throw new Error(explainDbError(error.message));
  revalidatePath(`/p/${postId}`);
  return Boolean(data);
}

export async function setPostStatus(postId: string, status: "active" | "resolved" | "deleted" | "removed"): Promise<void> {
  await member(`/p/${postId}`);
  const supabase = await createClient();
  const { error } = await supabase.from("posts").update({ status }).eq("id", postId);
  if (error) throw new Error(explainDbError(error.message));
  if (status === "deleted" || status === "removed") redirect("/feed");
  revalidatePath(`/p/${postId}`);
}

export async function deleteComment(postId: string, commentId: string): Promise<void> {
  await member(`/p/${postId}`);
  const supabase = await createClient();
  const { error } = await supabase.from("comments").update({ status: "deleted" }).eq("id", commentId);
  if (error) throw new Error(explainDbError(error.message));
  revalidatePath(`/p/${postId}`);
}

export async function joinPost(postId: string): Promise<void> {
  const session = await member(`/p/${postId}`);
  const supabase = await createClient();
  const { error } = await supabase.from("post_participants").insert({ university_id: session.universityId, post_id: postId, user_id: session.userId, kind: "member" });
  if (error && !/duplicate/i.test(error.message)) throw new Error(explainDbError(error.message));
  revalidatePath(`/p/${postId}`);
}

export async function leavePost(postId: string): Promise<void> {
  const session = await member(`/p/${postId}`);
  const supabase = await createClient();
  await supabase.from("post_participants").delete().eq("post_id", postId).eq("user_id", session.userId);
  revalidatePath(`/p/${postId}`);
}

export async function castVote(postId: string, options: number[]): Promise<void> {
  await member(`/p/${postId}`);
  const supabase = await createClient();
  const { error } = await supabase.rpc("cast_poll_vote", { p_post_id: postId, p_options: options });
  if (error) throw new Error(explainDbError(error.message));
  revalidatePath(`/p/${postId}`);
}

/** Take a tab: opens (or reopens) the double-blind thread with the notice owner. */
export async function openThread(postId: string): Promise<void> {
  const session = await member(`/p/${postId}`);
  const supabase = await createClient();
  const { data: existing } = await supabase.from("relay_threads").select("id").eq("post_id", postId).eq("initiator_id", session.userId).maybeSingle();
  if (existing) redirect(`/t/${existing.id}`);
  const { data, error } = await supabase
    .from("relay_threads")
    .insert({ university_id: session.universityId, post_id: postId, initiator_id: session.userId, owner_id: session.userId })
    .select("id")
    .single();
  if (error || !data) throw new Error(explainDbError(error?.message ?? ""));
  redirect(`/t/${data.id}`);
}
