import "server-only";
import type { AuthorSummary } from "@/lib/dal/posts";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ParticipantRow = Database["public"]["Tables"]["post_participants"]["Row"];
export type ThreadRow = Database["public"]["Tables"]["relay_threads"]["Row"];
export type MessageRow = Database["public"]["Tables"]["relay_messages"]["Row"];
export type ParticipantWithProfile = ParticipantRow & { profile: AuthorSummary | null };
export interface ThreadSummary {
  id: string;
  title: string;
  type: string;
}
export type ThreadWithPeople = ThreadRow & { post: ThreadSummary | null; initiator: AuthorSummary | null; owner: AuthorSummary | null };

const PROFILE = "user_id, display_name, initials, campus_username";
const THREAD_SELECT = `*, post:posts!relay_threads_post_id_posts_id_fk(id, title, type), initiator:profiles!relay_threads_initiator_id_profiles_user_id_fk(${PROFILE}), owner:profiles!relay_threads_owner_id_profiles_user_id_fk(${PROFILE})`;

async function uid(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  return data?.claims?.sub ?? null;
}

export async function listParticipants(postId: string): Promise<ParticipantWithProfile[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("post_participants")
    .select(`*, profile:profiles!post_participants_user_id_profiles_user_id_fk(${PROFILE})`)
    .eq("post_id", postId)
    .order("created_at", { ascending: true })
    .limit(500);
  if (error) throw new Error(`listParticipants: ${error.message}`);
  return (data ?? []) as unknown as ParticipantWithProfile[];
}

export async function pollResults(postId: string): Promise<Map<number, number>> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("poll_results", { p_post_id: postId });
  return new Map((data ?? []).map((r) => [r.option_index, r.votes]));
}

export async function myVote(postId: string): Promise<number[] | null> {
  const supabase = await createClient();
  const me = await uid();
  if (!me) return null;
  const { data } = await supabase.from("poll_votes").select("options").eq("post_id", postId).eq("user_id", me).maybeSingle();
  return data?.options ?? null;
}

export async function myThreadForPost(postId: string): Promise<ThreadRow | null> {
  const supabase = await createClient();
  const me = await uid();
  if (!me) return null;
  const { data } = await supabase.from("relay_threads").select("*").eq("post_id", postId).eq("initiator_id", me).maybeSingle();
  return data ?? null;
}

export async function listThreadsForPost(postId: string): Promise<ThreadWithPeople[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("relay_threads").select(THREAD_SELECT).eq("post_id", postId).order("last_message_at", { ascending: false, nullsFirst: false });
  if (error) throw new Error(`listThreadsForPost: ${error.message}`);
  return (data ?? []) as unknown as ThreadWithPeople[];
}

export async function listMyThreads(): Promise<ThreadWithPeople[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("relay_threads").select(THREAD_SELECT).order("last_message_at", { ascending: false, nullsFirst: false }).limit(100);
  if (error) throw new Error(`listMyThreads: ${error.message}`);
  return (data ?? []) as unknown as ThreadWithPeople[];
}

export async function getThread(id: string): Promise<ThreadWithPeople | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("relay_threads").select(THREAD_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error(`getThread: ${error.message}`);
  return (data as unknown as ThreadWithPeople | null) ?? null;
}

export async function listMessages(threadId: string): Promise<MessageRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("relay_messages").select("*").eq("thread_id", threadId).order("created_at", { ascending: true }).limit(500);
  if (error) throw new Error(`listMessages: ${error.message}`);
  return data ?? [];
}

/** The other party as the database lets you see them: name always, email only after mutual opt-in. */
export async function relayContact(threadId: string): Promise<{ display_name: string; campus_username: string; email: string | null } | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("relay_contact", { p_thread_id: threadId });
  return data?.[0] ?? null;
}

export async function currentTerm(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("current_term");
  return data ?? "";
}
