import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runWeeklyDigest } from "@/lib/email/digest";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Vercel cron target (vercel.json): weekly digest. Requires the CRON_SECRET bearer token. */
export const dynamic = "force-dynamic";

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function GET(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });
  const appUrl = process.env.APP_URL ?? "http://localhost:3000";
  const summaries = await runWeeklyDigest(appUrl);
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString(), summaries }, { headers: { "Cache-Control": "no-store" } });
}
