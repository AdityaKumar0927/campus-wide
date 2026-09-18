import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

/** A campus member as others see them: never the email, never the declared name in privacy mode. */
export async function getProfileByUsername(username: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("profiles").select("*").eq("campus_username", username.toLowerCase()).maybeSingle();
  if (error) throw new Error(`getProfileByUsername: ${error.message}`);
  return data ?? null;
}

export async function getProfileByUserId(userId: string): Promise<ProfileRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle();
  return data ?? null;
}
