import "server-only";
import type { AuthorSummary } from "@/lib/dal/posts";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";

export type ReportRow = Database["public"]["Tables"]["reports"]["Row"];
export type ActionRow = Database["public"]["Tables"]["moderation_actions"]["Row"];
export type AppealRow = Database["public"]["Tables"]["appeals"]["Row"];
export type AuditRow = Database["public"]["Tables"]["audit_log"]["Row"];
export type FeedbackRow = Database["public"]["Tables"]["feedback"]["Row"];
export type ReportWithSubject = ReportRow & { subject: AuthorSummary | null };
export type ActionWithSubject = ActionRow & { subject: AuthorSummary | null };
export interface StatementOfReasons {
  facts: string;
  ground: string;
  automated: boolean;
  redress: string;
  issued_at: string;
  duration_days: number | null;
}

const SUBJECT = "subject:profiles!reports_subject_id_profiles_user_id_fk(user_id, display_name, initials, campus_username)";
const ACTION_SUBJECT = "subject:profiles!moderation_actions_subject_id_profiles_user_id_fk(user_id, display_name, initials, campus_username)";

export async function listReports(status: "open" | "resolved" = "open"): Promise<ReportWithSubject[]> {
  const supabase = await createClient();
  let q = supabase.from("reports").select(`*, ${SUBJECT}`).order("created_at", { ascending: status === "open" }).limit(200);
  q = status === "open" ? q.in("status", ["open", "in_review"]) : q.in("status", ["actioned", "dismissed"]);
  const { data, error } = await q;
  if (error) throw new Error(`listReports: ${error.message}`);
  return (data ?? []) as unknown as ReportWithSubject[];
}

export async function getReport(id: string): Promise<ReportWithSubject | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select(`*, ${SUBJECT}`).eq("id", id).maybeSingle();
  return (data as unknown as ReportWithSubject | null) ?? null;
}

export async function getReportByCase(caseNumber: string): Promise<ReportRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("reports").select("*").eq("case_number", caseNumber.toUpperCase()).maybeSingle();
  return data ?? null;
}

export async function listMyReports(): Promise<ReportRow[]> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return [];
  const { data } = await supabase.from("reports").select("*").eq("reporter_id", uid).order("created_at", { ascending: false }).limit(50);
  return data ?? [];
}

export async function getAction(id: string): Promise<ActionWithSubject | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("moderation_actions").select(`*, ${ACTION_SUBJECT}`).eq("id", id).maybeSingle();
  return (data as unknown as ActionWithSubject | null) ?? null;
}

export async function listActionsForReport(reportId: string): Promise<ActionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("moderation_actions").select("*").eq("report_id", reportId).order("created_at", { ascending: false });
  return data ?? [];
}

/** The most recent live sanction against the caller (for the read-only banner and the banned page). */
export async function myLatestSanction(): Promise<ActionRow | null> {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const uid = claims?.claims?.sub;
  if (!uid) return null;
  const { data } = await supabase.from("moderation_actions").select("*").eq("subject_id", uid).in("kind", ["suspend", "ban"]).is("reversed_at", null).order("created_at", { ascending: false }).limit(1).maybeSingle();
  return data ?? null;
}

export async function getAppealForAction(actionId: string): Promise<AppealRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("appeals").select("*").eq("action_id", actionId).maybeSingle();
  return data ?? null;
}

export type AppealWithAction = AppealRow & { action: ActionWithSubject | null };

export async function listAppeals(status: "open" | "decided" = "open"): Promise<AppealWithAction[]> {
  const supabase = await createClient();
  let q = supabase.from("appeals").select(`*, action:moderation_actions!appeals_action_id_moderation_actions_id_fk(*, ${ACTION_SUBJECT})`).order("created_at", { ascending: true }).limit(100);
  q = status === "open" ? q.eq("status", "open") : q.neq("status", "open");
  const { data, error } = await q;
  if (error) throw new Error(`listAppeals: ${error.message}`);
  return (data ?? []) as unknown as AppealWithAction[];
}

export async function listAuditLog(limit = 100): Promise<AuditRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("audit_log").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}

export async function adminStats(): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_campus_stats");
  return (data as Record<string, unknown> | null) ?? null;
}

export async function publicStats(slug: string): Promise<Record<string, unknown> | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("public_campus_stats", { p_slug: slug });
  return (data as Record<string, unknown> | null) ?? null;
}

export async function listFeedback(limit = 100): Promise<FeedbackRow[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("feedback").select("*").order("created_at", { ascending: false }).limit(limit);
  return data ?? [];
}
