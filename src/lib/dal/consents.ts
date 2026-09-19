import "server-only";
import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export interface PendingConsent {
  id: string;
  slug: string;
  version: string;
  title: string;
  summary: string | null;
}

/**
 * Required policy versions the caller has not accepted yet (docs/BRIEF.md §7 re-consent). Cached per
 * request, and empty whenever the database is unreachable so a hiccup never locks anyone out.
 */
export const pendingConsents = cache(async (): Promise<PendingConsent[]> => {
  try {
    const supabase = await createClient();
    const { data } = await supabase.rpc("pending_consents");
    return (data ?? []) as PendingConsent[];
  } catch {
    return [];
  }
});
