"use server";

import { revalidatePath } from "next/cache";
import { complete, serverAiConfigured } from "@/lib/ai/groq";
import { getCampus } from "@/lib/dal/campus";
import { getReport } from "@/lib/dal/moderation";
import { requireRole } from "@/lib/dal/session";
import type { Json } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export interface Triage {
  suggested_category: string;
  severity: "low" | "medium" | "high";
  summary: string;
  generated_at: string;
}

/** Labels for ordering the queue. A human still reads the evidence and decides; nothing here acts. */
export async function triageReport(reportId: string): Promise<Triage | null> {
  await requireRole("moderator");
  const campus = await getCampus();
  if (!campus?.featureFlags.ai_server || !serverAiConfigured()) return null;
  const report = await getReport(reportId);
  if (!report) return null;
  const supabase = await createClient();
  const { error: limited } = await supabase.rpc("take_rate_limit", { p_action: "ai", p_max: 60, p_window_seconds: 86400 });
  if (limited) return null;
  const ev = report.evidence as Record<string, unknown>;
  const item = JSON.stringify(ev.post ?? ev.comment ?? ev.thread ?? ev.profile ?? {}).slice(0, 6000);
  const raw = await complete(
    'You label reports for a campus notice board. Reply with JSON only: {"suggested_category": one of harassment|stalking|scam|impersonation|hate|sexual|meal_resale|prohibited_item|spam|other, "severity": "low"|"medium"|"high", "summary": one sentence}. Never recommend an action.',
    `Reporter says: ${report.category}. Note: ${report.note ?? ""}\nItem: ${item}`,
    200,
  );
  if (!raw) return null;
  try {
    const json = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim()) as Partial<Triage>;
    const triage: Triage = {
      suggested_category: String(json.suggested_category ?? "other").slice(0, 40),
      severity: json.severity === "high" || json.severity === "medium" ? json.severity : "low",
      summary: String(json.summary ?? "").slice(0, 300),
      generated_at: new Date().toISOString(),
    };
    await supabase.rpc("set_report_triage", { p_report_id: reportId, p_triage: triage as unknown as Json });
    revalidatePath(`/mod/reports/${reportId}`);
    return triage;
  } catch {
    return null;
  }
}
