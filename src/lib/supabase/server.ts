import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import "server-only";
import { supabaseEnv } from "./env";

export { isSupabaseConfigured } from "./env";

/**
 * Server client for Server Components, Server Actions, and Route Handlers. Sessions live in cookies
 * (proxy.ts refreshes them); the Data Access Layer calls `auth.getClaims()` on every request and never
 * trusts `getSession()`.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseEnv.url!, supabaseEnv.publishableKey!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, which cannot set cookies. proxy.ts refreshes sessions, so
          // this is safe to ignore.
        }
      },
    },
  });
}

