"use server";

import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

export type ConsentState = { error?: string };

/** Records acceptance of every pending required policy, with the version, time, IP hash, and agent. */
export async function acceptPolicies(_prev: ConsentState, formData: FormData): Promise<ConsentState> {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/consent");
  const ids = formData.getAll("policy").filter((v): v is string => typeof v === "string");
  if (ids.length === 0) return { error: "Nothing to accept." };
  if (formData.get("accept") !== "on") return { error: "Tick the box to accept." };

  const h = await headers();
  const ipHash = createHash("sha256")
    .update((h.get("x-forwarded-for") ?? "").split(",")[0].trim() + (process.env.CRON_SECRET ?? "salt"))
    .digest("hex");
  const userAgent = (h.get("user-agent") ?? "").slice(0, 300);
  const supabase = await createClient();
  const { error } = await supabase.from("consent_records").insert(
    ids.map((id) => ({ user_id: session.userId, policy_version_id: id, choice: "accept", accepted: true, ip_hash: ipHash, user_agent: userAgent })),
  );
  if (error) return { error: "Could not record your acceptance. Try again." };
  redirect("/feed");
}
