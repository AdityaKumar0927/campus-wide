import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { pushConfigured, pushToUser } from "@/lib/push/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Called by the database (pg_net) when a notification row is written, with the shared secret from
 * platform_settings. Reads the row as the service role and pushes it to that member's browsers.
 */
export const dynamic = "force-dynamic";

function authorised(req: Request): boolean {
  const secret = process.env.PUSH_DISPATCH_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export async function POST(req: Request) {
  if (!authorised(req)) return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  if (!isSupabaseConfigured() || !pushConfigured()) return NextResponse.json({ ok: true, skipped: "not configured" });
  const body = (await req.json().catch(() => null)) as { notification_id?: string } | null;
  if (!body?.notification_id) return NextResponse.json({ error: "notification_id required" }, { status: 400 });
  const admin = createAdminClient();
  const { data } = await admin.from("notifications").select("user_id, title, body, href, kind").eq("id", body.notification_id).maybeSingle();
  if (!data) return NextResponse.json({ ok: true, skipped: "gone" });
  const sent = await pushToUser(data.user_id, { title: data.title, body: data.body ?? undefined, href: data.href ?? "/inbox", tag: data.kind });
  return NextResponse.json({ ok: true, sent }, { headers: { "Cache-Control": "no-store" } });
}
