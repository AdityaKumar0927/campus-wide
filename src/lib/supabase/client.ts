"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client. Uses the publishable key only; RLS enforces every read and write. */
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
