import { NextResponse } from "next/server";
import { cronAuthorised } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/** Daily backstop for the pg_cron jobs: expires notices past their date and lifts served suspensions. */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!cronAuthorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "database not configured" }, { status: 503 });
  const { data, error } = await createAdminClient().rpc("run_maintenance");
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, ...((data as Record<string, number>) ?? {}), ranAt: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
