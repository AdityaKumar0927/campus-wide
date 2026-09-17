import { NextRequest, NextResponse } from "next/server";
import { cspFromEnv } from "@/lib/security/csp";
import { refreshSession } from "@/lib/supabase/proxy";

/**
 * Network boundary. This file NEVER makes authorization decisions — those live in the Data Access
 * Layer and in Postgres RLS (ARCHITECTURE.md §5, CVE-2025-29927). It only:
 *  1. generates a per-request CSP nonce and sets the CSP header,
 *  2. drops `x-middleware-subrequest` from forwarded request headers (defence in depth; Vercel's
 *     edge already filters it and Next.js ≥ 15.2.3 is patched),
 *  3. (Phase 2) refreshes the Supabase session cookie and redirects signed-out users for UX.
 */
const SIGNED_IN_ONLY = ["/feed", "/questions", "/post", "/inbox", "/more", "/events", "/market", "/meals", "/lost-found", "/rides", "/study", "/roommates", "/polls", "/settings", "/onboarding"];

export async function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = cspFromEnv(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-subrequest");
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);

  // Session refresh + UX redirect only. The DAL and RLS decide what a request may actually do.
  const claims = await refreshSession(request, response);
  const path = request.nextUrl.pathname;
  const needsSession = SIGNED_IN_ONLY.some((p) => path === p || path.startsWith(p + "/"));
  if (needsSession && !claims && (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL)) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.searchParams.set("next", path);
    const redirect = NextResponse.redirect(url);
    redirect.headers.set("Content-Security-Policy", csp);
    return redirect;
  }
  return response;
}

export const config = {
  matcher: [
    {
      // Everything except Next internals, static assets, and API routes (which set their own headers).
      source: "/((?!api|_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icons/|\.well-known/).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
