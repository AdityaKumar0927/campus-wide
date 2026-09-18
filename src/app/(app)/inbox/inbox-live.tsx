"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Keeps the inbox current while it is open: one Realtime channel on the caller's own notifications
 * (RLS-filtered), with a slow poll as the fallback when the socket never connects.
 */
export function InboxLive({ userId }: { userId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    let subscribed = false;
    const channel = supabase
      .channel(`inbox:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, () => router.refresh())
      .subscribe((status) => {
        subscribed = status === "SUBSCRIBED";
      });
    const poll = setInterval(() => {
      if (!subscribed && document.visibilityState === "visible") router.refresh();
    }, 60_000);
    return () => {
      clearInterval(poll);
      supabase.removeChannel(channel);
    };
  }, [router, userId]);
  return null;
}
