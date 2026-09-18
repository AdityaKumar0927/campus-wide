import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export async function listNotifications(limit = 50): Promise<NotificationRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
  if (error) throw new Error(`listNotifications: ${error.message}`);
  return data ?? [];
}

/** Cheap badge count for the shell; zero when signed out or not configured. */
export async function unreadCount(): Promise<number> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("unread_notification_count");
    return data ?? 0;
  } catch {
    return 0;
  }
}
