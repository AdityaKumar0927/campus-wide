import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron";
import { runWeeklyDigest } from "@/lib/email/digest";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Vercel cron target (vercel.json): weekly digest. Requires the CRON_SECRET bearer token. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const summaries = await runWeeklyDigest(appUrl);
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), summaries }, { headers: { "Cache-Control": "no-store" } });
}
