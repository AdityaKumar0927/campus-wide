import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type SpaceRow = Database["public"]["Tables"]["spaces"]["Row"];

export async function listSpaces(): Promise<SpaceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("spaces").select("*").order("is_default", { ascending: false }).order("member_count", { ascending: false }).order("name");
  if (error) throw new Error(`listSpaces: ${error.message}`);
  return data ?? [];
}

export async function getSpaceBySlug(slug: string): Promise<SpaceRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("spaces").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`getSpaceBySlug: ${error.message}`);
  return data ?? null;
}

/** Space ids the caller has joined. */
export async function mySpaceIds(): Promise<Set<string>> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return new Set();
  const { data } = await supabase.from("space_memberships").select("space_id").eq("user_id", uid);
  return new Set((data ?? []).map((r) => r.space_id));
}

export async function getSpaceById(id: string): Promise<SpaceRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("spaces").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}
