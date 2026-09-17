import "server-only";
import { cache } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * The caller's verified context. Every DAL function starts here. Claims come from getClaims()
 * (signature-verified on every request); membership and profile come from RLS-protected reads.
 */
export interface Session {
  userId: string;
  email: string;
  universityId: string | null;
  membership: { campusRole: string; status: string; verifiedTerm: string | null } | null;
  profile: { displayName: string; initials: string; campusUsername: string; privacyMode: boolean; onboardedAt: string | null } | null;
  namePending: boolean;
}

export const getSession = cache(async (): Promise<Session | null> => {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const claims = data.claims as { sub: string; email?: string; app_metadata?: { university_id?: string } };

  const [{ data: me }, { data: membership }, { data: profile }] = await Promise.all([
    supabase.from("users").select("name_pending, email").eq("id", claims.sub).maybeSingle(),
    supabase.from("memberships").select("campus_role, status, verified_term").eq("user_id", claims.sub).maybeSingle(),
    supabase.from("profiles").select("display_name, initials, campus_username, privacy_mode, onboarded_at").eq("user_id", claims.sub).maybeSingle(),
  ]);

  return {
    userId: claims.sub,
    email: me?.email ?? claims.email ?? "",
    universityId: claims.app_metadata?.university_id ?? null,
    membership: membership
      ? { campusRole: membership.campus_role, status: membership.status, verifiedTerm: membership.verified_term }
      : null,
    profile: profile
      ? {
          displayName: profile.display_name,
          initials: profile.initials,
          campusUsername: profile.campus_username,
          privacyMode: profile.privacy_mode,
          onboardedAt: profile.onboarded_at,
        }
      : null,
    namePending: me?.name_pending ?? true,
  };
});

export class AuthError extends Error {
  constructor(public readonly code: "signed_out" | "onboarding_required" | "read_only" | "forbidden", message?: string) {
    super(message ?? code);
  }
}

/** A signed-in, active member who has finished onboarding. Throws otherwise (callers redirect). */
export async function requireMember(): Promise<Session & { universityId: string }> {
  const session = await getSession();
  if (!session || !session.universityId) throw new AuthError("signed_out");
  if (session.namePending || !session.profile?.onboardedAt) throw new AuthError("onboarding_required");
  if (session.membership?.status !== "active") throw new AuthError("read_only");
  return session as Session & { universityId: string };
}

export async function requireRole(role: "moderator" | "university_admin") {
  const session = await requireMember();
  const r = session.membership?.campusRole;
  const ok = role === "moderator" ? r === "moderator" || r === "university_admin" : r === role;
  if (!ok) throw new AuthError("forbidden");
  return session;
}
