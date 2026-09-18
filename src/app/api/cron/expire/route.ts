import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Daily backstop for the hourly pg_cron sweep: marks notices past their expiry as expired. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });
  const { data, error } = await createAdminClient().rpc("run_expire_posts");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, expired: data ?? 0, ranAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
