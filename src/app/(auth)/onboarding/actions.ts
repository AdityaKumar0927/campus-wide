"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getSession } from "@/lib/dal/session";
import { SAFETY_RULES } from "@/lib/safety-rules";
import { createClient } from "@/lib/supabase/server";

const nameSchema = z.string().trim().min(1).max(60).regex(/^[\p{L}][\p{L} .'-]*$/u, "Letters, spaces, apostrophes, and hyphens only.");

export type OnboardingState = { error?: string };

export async function completeOnboarding(_prev: OnboardingState, formData: FormData): Promise<OnboardingState> {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/onboarding");

  const given = nameSchema.safeParse(formData.get("given"));
  const family = nameSchema.safeParse(formData.get("family"));
  if (!given.success || !family.success) return { error: "Enter your first name and family name as they appear on your HawkCard." };
  if (formData.get("age") !== "on") return { error: "You must be 17 or older to use Campus Wide." };
  if (formData.get("policies") !== "on") return { error: "Please accept the terms, the privacy notice, and the community guidelines." };
  for (const rule of SAFETY_RULES) {
    if (formData.get(`rule_${rule.key}`) !== "on") return { error: "Please read and tick every house rule." };
  }

  const supabase = await createClient();
  const h = await headers();
  const ipHash = createHash("sha256").update((h.get("x-forwarded-for") ?? "").split(",")[0].trim() + (process.env.CRON_SECRET ?? "salt")).digest("hex");
  const userAgent = (h.get("user-agent") ?? "").slice(0, 300);

  // Every required policy version is accepted here, with its version, the time, and this device
  // (docs/BRIEF.md §7). The house rules are recorded line by line as well.
  const { data: required } = await supabase.rpc("pending_consents");
  const rows: { user_id: string; policy_version_id: string; choice: string; accepted: boolean; ip_hash: string; user_agent: string }[] = [];
  for (const policy of required ?? []) {
    if (policy.slug === "safety-rules") {
      for (const rule of SAFETY_RULES) rows.push({ user_id: session.userId, policy_version_id: policy.id, choice: rule.key, accepted: true, ip_hash: ipHash, user_agent: userAgent });
      rows.push({ user_id: session.userId, policy_version_id: policy.id, choice: "marketing", accepted: formData.get("marketing") === "on", ip_hash: ipHash, user_agent: userAgent });
    } else {
      rows.push({ user_id: session.userId, policy_version_id: policy.id, choice: "accept", accepted: true, ip_hash: ipHash, user_agent: userAgent });
    }
  }
  if (rows.length > 0) {
    const { error } = await supabase.from("consent_records").insert(rows);
    if (error) return { error: "Could not record your consent. Try again." };
  }

  if (session.namePending) {
    const { error } = await supabase.rpc("declare_name", { given: given.data, family: family.data, age_attested: true });
    if (error) return { error: error.message.includes("locked") ? "Your name is already set. Ask a moderator to change it." : error.message };
  }
  redirect("/feed");
}
