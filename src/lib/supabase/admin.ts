import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/**
 * Service-role client for scheduled jobs and trusted server code only. It bypasses RLS, so it must
 * never be reachable from a request that acts on behalf of a user.
 */
export function createAdminClient() {
  if (!supabaseEnv.url || !supabaseEnv.secretKey) throw new Error("Supabase service credentials are not configured");
  return createClient<Database>(supabaseEnv.url, supabaseEnv.secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}
