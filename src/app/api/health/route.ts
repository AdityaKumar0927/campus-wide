import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Liveness probe used by uptime checks and (after launch) the daily keep-alive ping.
 * Phase 2 adds one cheap database query so Supabase counts the request as activity.
 */
export function GET() {
  return NextResponse.json(
    { status: "ok", service: "campus-wide", time: new Date().toISOString() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
