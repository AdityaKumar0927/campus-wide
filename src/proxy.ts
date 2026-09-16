import { NextRequest, NextResponse } from "next/server";
import { cspFromEnv } from "@/lib/security/csp";

/**
 * Network boundary. This file NEVER makes authorization decisions — those live in the Data Access
 * Layer and in Postgres RLS (ARCHITECTURE.md §5, CVE-2025-29927). It only:
 *  1. generates a per-request CSP nonce and sets the CSP header,
 *  2. drops `x-middleware-subrequest` from forwarded request headers (defence in depth; Vercel's
 *     edge already filters it and Next.js ≥ 15.2.3 is patched),
 *  3. (Phase 2) refreshes the Supabase session cookie and redirects signed-out users for UX.
 */
export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = cspFromEnv(nonce);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-middleware-subrequest");
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
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
