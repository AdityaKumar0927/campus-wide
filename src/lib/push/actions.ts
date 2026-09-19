"use server";

import { headers } from "next/headers";
import { getSession } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

/** Stores or removes this browser's push subscription. RLS keeps every row to its owner. */
export async function savePushSubscription(subscription: { endpoint: string; keys: { p256dh: string; auth: string } }): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;
  const h = await headers();
  const supabase = await createClient();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: session.userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      user_agent: (h.get("user-agent") ?? "").slice(0, 300),
      last_used_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );
  return !error;
}

export async function removePushSubscription(endpoint: string): Promise<void> {
  const session = await getSession();
  if (!session) return;
  const supabase = await createClient();
  await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);
}
