"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";
import { supabaseEnv } from "./env";

/** Browser client. Uses the publishable key only; RLS enforces every read and write. */
export function createClient() {
  return createBrowserClient<Database>(supabaseEnv.url!, supabaseEnv.publishableKey!);
}
