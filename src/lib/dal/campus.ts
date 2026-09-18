import "server-only";
import { cache } from "react";
import { POST_TYPES, POST_TYPE_META, type PostType } from "@/lib/posts/types";
import { createClient } from "@/lib/supabase/server";

export interface SafeSpot {
  name: string;
  note?: string;
  campus?: string;
}
export interface DiningPeriod {
  name: string;
  start: string;
  end: string;
  days: string;
}
export interface DiningLocation {
  slug: string;
  name: string;
  building?: string;
  kind?: string;
  guest_meals?: boolean;
  periods?: DiningPeriod[];
}
export interface Campus {
  id: string;
  name: string;
  shortName: string;
  timezone: string;
  featureFlags: Record<string, boolean>;
  policyText: Record<string, string>;
  safeExchangeLocations: SafeSpot[];
  diningLocations: DiningLocation[];
}

/** The caller's campus row (RLS returns exactly one). Cached per request. */
export const getCampus = cache(async (): Promise<Campus | null> => {
  const supabase = await createClient();
  const { data } = await supabase.from("universities").select("id, name, short_name, timezone, feature_flags, policy_text, safe_exchange_locations, dining_locations").limit(1).maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    shortName: data.short_name ?? data.name,
    timezone: data.timezone,
    featureFlags: (data.feature_flags as Record<string, boolean>) ?? {},
    policyText: (data.policy_text as Record<string, string>) ?? {},
    safeExchangeLocations: (data.safe_exchange_locations as unknown as SafeSpot[]) ?? [],
    diningLocations: (data.dining_locations as unknown as DiningLocation[]) ?? [],
  };
});

/** Types the campus has switched on (the database enforces the same flags on insert). */
export function enabledTypes(flags: Record<string, boolean> | undefined): PostType[] {
  return POST_TYPES.filter((t) => {
    const flag = POST_TYPE_META[t].flag;
    return !flag || Boolean(flags?.[flag]);
  });
}

export function typeEnabled(flags: Record<string, boolean> | undefined, type: PostType): boolean {
  const flag = POST_TYPE_META[type].flag;
  return !flag || Boolean(flags?.[flag]);
}
