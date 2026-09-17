import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import "server-only";

/**
 * Server client for Server Components, Server Actions, and Route Handlers. Sessions live in cookies
 * (proxy.ts refreshes them); the Data Access Layer calls `auth.getClaims()` on every request and never
 * trusts `getSession()`.
 */
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
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

/** True when the Supabase environment is configured (lets the skeleton run without a project). */
export function isSupabaseConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}
