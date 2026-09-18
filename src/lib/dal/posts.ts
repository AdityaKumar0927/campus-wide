import "server-only";
import type { PostType } from "@/lib/posts/types";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

/**
 * Posts and answers. Every query runs as the caller through RLS; this layer only shapes the data.
 * Paging is by page number (never infinite), PLAN.md Phase 3.
 */

export type PostRow = Database["public"]["Tables"]["posts"]["Row"];
export type CommentRow = Database["public"]["Tables"]["comments"]["Row"];
export interface AuthorSummary {
  user_id: string;
  display_name: string;
  initials: string;
  campus_username: string;
}
export type PostWithAuthor = PostRow & { author: AuthorSummary | null };
export type CommentWithAuthor = CommentRow & { author: AuthorSummary | null };

export const AUTHOR_EMBED = "author:profiles!posts_author_id_profiles_user_id_fk(user_id, display_name, initials, campus_username)";
const COMMENT_AUTHOR_EMBED = "author:profiles!comments_author_id_profiles_user_id_fk(user_id, display_name, initials, campus_username)";

export const PAGE_SIZE = 20;

export interface FeedQuery {
  sort?: "new" | "helpful" | "active";
  type?: PostType | "all";
  spaceId?: string;
  authorId?: string;
  unansweredOnly?: boolean;
  page?: number;
  limit?: number;
}

export interface Page<T> {
  items: T[];
  page: number;
  hasNext: boolean;
}

export async function listPosts(q: FeedQuery = {}): Promise<Page<PostWithAuthor>> {
  const supabase = await createClient();
  const limit = q.limit ?? PAGE_SIZE;
  const page = Math.max(1, q.page ?? 1);
  const from = (page - 1) * limit;

  let query = supabase
    .from("posts")
    .select(`*, ${AUTHOR_EMBED}`)
    .in("status", ["active", "resolved", "expired"])
    .range(from, from + limit); // one extra row tells us whether a next page exists

  if (q.type && q.type !== "all") query = query.eq("type", q.type);
  if (q.spaceId) query = query.eq("space_id", q.spaceId);
  if (q.authorId) query = query.eq("author_id", q.authorId);
  if (q.unansweredOnly) query = query.eq("comment_count", 0).eq("status", "active");

  switch (q.sort) {
    case "helpful":
      query = query.order("thanks_count", { ascending: false }).order("comment_count", { ascending: false }).order("created_at", { ascending: false });
      break;
    case "active":
      query = query.order("last_activity_at", { ascending: false });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw new Error(`listPosts: ${error.message}`);
  const rows = (data ?? []) as unknown as PostWithAuthor[];
  return { items: rows.slice(0, limit), page, hasNext: rows.length > limit };
}

export async function getPost(id: string): Promise<PostWithAuthor | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("posts").select(`*, ${AUTHOR_EMBED}`).eq("id", id).maybeSingle();
  if (error) throw new Error(`getPost: ${error.message}`);
  return (data as unknown as PostWithAuthor | null) ?? null;
}

export async function listComments(postId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("comments")
    .select(`*, ${COMMENT_AUTHOR_EMBED}`)
    .eq("post_id", postId)
    .eq("status", "active")
    .order("is_accepted", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) throw new Error(`listComments: ${error.message}`);
  return (data ?? []) as unknown as CommentWithAuthor[];
}

/** Which of the given targets the caller has already thanked. */
export async function myThanks(targetIds: string[]): Promise<Set<string>> {
  if (targetIds.length === 0) return new Set();
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const uid = data?.claims?.sub;
  if (!uid) return new Set();
  const { data: rows } = await supabase.from("reactions").select("target_id").eq("user_id", uid).eq("kind", "thanks").in("target_id", targetIds);
  return new Set((rows ?? []).map((r) => r.target_id));
}

export async function searchPosts(q: string, limit = 20): Promise<PostWithAuthor[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_posts", { q: term, p_limit: limit }).select(`*, ${AUTHOR_EMBED}`);
  if (error) throw new Error(`searchPosts: ${error.message}`);
  return (data ?? []) as unknown as PostWithAuthor[];
}

/** Turns a database error into a sentence the user can act on. */
export function explainDbError(message: string): string {
  if (/rate_limited/.test(message)) return "You are posting quickly. Wait a little and try again.";
  if (/row-level security|permission|not allowed|42501/.test(message)) return "You cannot do that on this board.";
  if (/expiry must be in the future/.test(message)) return "Pick an expiry in the future.";
  if (/not open for replies/.test(message)) return "This notice is no longer open for replies.";
  return "Something went wrong. Try again.";
}
