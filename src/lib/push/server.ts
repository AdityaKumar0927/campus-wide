import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Web Push (ARCHITECTURE.md §9). Keys live only in the environment; without them every call is a
 * no-op, so a deployment without push simply has no push. Dead subscriptions are deleted on 404/410.
 */
export function pushConfigured(): boolean {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

function configure(): boolean {
  if (!pushConfigured()) return false;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? `mailto:${process.env.FEEDBACK_ADMIN_EMAIL ?? "security@campus-wide.invalid"}`,
    process.env.VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
  return true;
}

export interface PushPayload {
  title: string;
  body?: string;
  href?: string;
  tag?: string;
}

/** Sends one payload to every browser a member has registered. Returns how many were delivered. */
export async function pushToUser(userId: string, payload: PushPayload): Promise<number> {
  if (!configure()) return 0;
  const admin = createAdminClient();
  const { data: subs } = await admin.from("push_subscriptions").select("id, endpoint, p256dh, auth").eq("user_id", userId);
  if (!subs?.length) return 0;
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify(payload), { TTL: 3600 });
        sent += 1;
        await admin.from("push_subscriptions").update({ last_used_at: new Date().toISOString(), failed_at: null }).eq("id", s.id);
      } catch (err) {
        const status = (err as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) await admin.from("push_subscriptions").delete().eq("id", s.id);
        else await admin.from("push_subscriptions").update({ failed_at: new Date().toISOString() }).eq("id", s.id);
      }
    }),
  );
  return sent;
}
