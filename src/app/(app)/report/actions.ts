"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { explainDbError } from "@/lib/dal/posts";
import { AuthError, requireMember } from "@/lib/dal/session";
import { REPORT_CATEGORIES } from "@/lib/moderation/constants";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  targetType: z.enum(["post", "comment", "thread", "profile"]),
  targetId: z.string().uuid(),
  category: z.enum(REPORT_CATEGORIES.map(([k]) => k) as [string, ...string[]]),
  note: z.string().trim().max(4000).default(""),
  escalation: z.boolean().default(false),
});

export type ReportState = { error?: string };

export async function fileReport(_prev: ReportState, formData: FormData): Promise<ReportState> {
  try {
    await requireMember();
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? "/sign-in?next=/report" : e.code === "onboarding_required" ? "/onboarding" : "/feed");
    throw e;
  }
  const parsed = schema.safeParse({
    targetType: formData.get("targetType"),
    targetId: formData.get("targetId"),
    category: formData.get("category"),
    note: formData.get("note") ?? "",
    escalation: formData.get("escalation") === "on",
  });
  if (!parsed.success) return { error: "Pick what happened and check the form." };
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("file_report", {
    p_target_type: parsed.data.targetType,
    p_target_id: parsed.data.targetId,
    p_category: parsed.data.category as "other",
    p_note: parsed.data.note || undefined,
    p_escalation: parsed.data.escalation,
  });
  if (error || !data) return { error: /yourself/.test(error?.message ?? "") ? "You cannot report yourself." : /target not found/.test(error?.message ?? "") ? "That item is no longer on the board." : explainDbError(error?.message ?? "") };
  redirect(`/reports/${data}`);
}
