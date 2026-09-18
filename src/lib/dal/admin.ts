import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type DomainRow = Database["public"]["Tables"]["university_domains"]["Row"];
export type MembershipRow = Database["public"]["Tables"]["memberships"]["Row"];
export type MemberWithProfile = MembershipRow & { profile: { user_id: string; display_name: string; initials: string; campus_username: string } | null };

export async function listDomains(): Promise<DomainRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("university_domains").select("*").order("domain");
  return data ?? [];
}

/** Members by role; profiles are embedded through the shared user id. */
export async function listMembers(opts: { roles?: string[]; username?: string; limit?: number } = {}): Promise<MemberWithProfile[]> {
  const supabase = await createClient();
  let q = supabase.from("memberships").select("*").order("created_at", { ascending: false }).limit(opts.limit ?? 50);
  if (opts.roles && opts.roles.length > 0) q = q.in("campus_role", opts.roles as MembershipRow["campus_role"][]);
  const { data: rows } = await q;
  const memberships = rows ?? [];
  if (memberships.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("user_id, display_name, initials, campus_username")
    .in("user_id", memberships.map((m) => m.user_id));
  const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  const merged = memberships.map((m) => ({ ...m, profile: byUser.get(m.user_id) ?? null }));
  const username = opts.username?.toLowerCase();
  return username ? merged.filter((m) => m.profile?.campus_username === username) : merged;
}

export async function listBlocked(): Promise<{ id: string; blocked_id: string; created_at: string; profile: { display_name: string; campus_username: string } | null }[]> {
  const supabase = await createClient();
  const { data: blocks } = await supabase.from("blocks").select("id, blocked_id, created_at").order("created_at", { ascending: false });
  const list = blocks ?? [];
  if (list.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, campus_username").in("user_id", list.map((b) => b.blocked_id));
  const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return list.map((b) => ({ ...b, profile: byUser.get(b.blocked_id) ?? null }));
}

export async function listMuted(): Promise<{ id: string; muted_id: string; profile: { display_name: string; campus_username: string } | null }[]> {
  const supabase = await createClient();
  const { data: mutes } = await supabase.from("mutes").select("id, muted_id").order("created_at", { ascending: false });
  const list = mutes ?? [];
  if (list.length === 0) return [];
  const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, campus_username").in("user_id", list.map((m) => m.muted_id));
  const byUser = new Map((profiles ?? []).map((p) => [p.user_id, p]));
  return list.map((m) => ({ ...m, profile: byUser.get(m.muted_id) ?? null }));
}

export async function myRelationTo(userId: string): Promise<{ blocked: boolean; muted: boolean }> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return { blocked: false, muted: false };
  const [{ data: b }, { data: m }] = await Promise.all([
    supabase.from("blocks").select("id").eq("blocker_id", uid).eq("blocked_id", userId).maybeSingle(),
    supabase.from("mutes").select("id").eq("muter_id", uid).eq("muted_id", userId).maybeSingle(),
  ]);
  return { blocked: Boolean(b), muted: Boolean(m) };
}
