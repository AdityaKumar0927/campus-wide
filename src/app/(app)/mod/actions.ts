"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { explainDbError } from "@/lib/dal/posts";
import { AuthError, requireRole } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

export type ModState = { error?: string; ok?: string };

async function moderator() {
  try {
    return await requireRole("moderator");
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? "/sign-in?next=/mod" : "/feed");
    throw e;
  }
}

const decisionSchema = z.object({
  reportId: z.string().uuid().nullable(),
  targetType: z.enum(["post", "comment", "thread", "profile"]),
  targetId: z.string().uuid(),
  subjectId: z.string().uuid().nullable(),
  kind: z.enum(["hide", "remove", "warn", "suspend", "ban", "restore", "dismiss", "privacy_mode"]),
  facts: z.string().trim().max(4000).default(""),
  ground: z.string().trim().max(400).default(""),
  days: z.coerce.number().int().min(1).max(365).nullable().default(null),
});

export async function decide(_prev: ModState, formData: FormData): Promise<ModState> {
  await moderator();
  const parsed = decisionSchema.safeParse({
    reportId: formData.get("reportId") || null,
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    subjectId: formData.get("subjectId") || null,
    kind: formData.get("kind"),
    facts: formData.get("facts") ?? "",
    ground: formData.get("ground") ?? "",
    days: formData.get("days") || null,
  });
  if (!parsed.success) return { error: "Check the decision form." };
  const d = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("moderate", {
    p_report_id: (d.reportId ?? null) as unknown as string,
    p_target_type: d.targetType,
    p_target_id: d.targetId,
    p_subject: (d.subjectId ?? null) as unknown as string,
    p_kind: d.kind,
    p_facts: d.facts,
    p_ground: d.ground,
    p_days: d.days ?? undefined,
  });
  if (error) return { error: /statement of reasons/.test(error.message) ? "Write the facts (at least ten characters) and name the ground." : /yourself/.test(error.message) ? "You cannot moderate yourself." : explainDbError(error.message) };
  revalidatePath("/mod");
  if (d.reportId) revalidatePath(`/mod/reports/${d.reportId}`);
  return { ok: data ?? "done" };
}

export async function decideAppeal(_prev: ModState, formData: FormData): Promise<ModState> {
  await moderator();
  const appealId = String(formData.get("appealId") ?? "");
  const outcome = formData.get("outcome") === "overturned" ? "overturned" : "upheld";
  const reasons = String(formData.get("reasons") ?? "").trim();
  if (!appealId) return { error: "Missing appeal." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("decide_appeal", { p_appeal_id: appealId, p_outcome: outcome, p_reasons: reasons });
  if (error) return { error: /different moderator/.test(error.message) ? "A different moderator has to decide this one." : /reasons/.test(error.message) ? "Give reasons (at least ten characters)." : explainDbError(error.message) };
  revalidatePath("/mod/appeals");
  return { ok: outcome };
}
