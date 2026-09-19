import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type DeletionRequestRow = Database["public"]["Tables"]["deletion_requests"]["Row"];

/** The caller's live deletion request, if any (RLS returns only their own row). */
export async function getDeletionRequest(): Promise<DeletionRequestRow | null> {
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("deletion_requests").select("*").is("cancelled_at", null).is("purged_at", null).maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}
