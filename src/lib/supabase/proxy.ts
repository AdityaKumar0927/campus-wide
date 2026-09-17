import { createServerClient } from "@supabase/ssr";
import type { NextRequest, NextResponse } from "next/server";
import { supabaseEnv } from "./env";

/**
 * Refreshes the Supabase session cookie inside proxy.ts and returns the verified claims (or null).
 * The claims are for UX redirects only; authorization happens in the DAL and in RLS.
 * Do not add logic between creating the client and calling getClaims(): the refreshed cookies must
 * be written to both the forwarded request and the response.
 */
export async function refreshSession(request: NextRequest, response: NextResponse) {
  const url = supabaseEnv.url;
  const key = supabaseEnv.publishableKey;
  if (!url || !key) return null;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  return data?.claims ?? null;
}
