import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Outbound email with a daily send budget (ARCHITECTURE.md §9). Resend is the provider when
 * RESEND_API_KEY is set; without it the message is recorded as skipped so nothing silently fails.
 * The budget keeps headroom for auth mail, which Supabase sends on its own.
 */
export interface Mail {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export type SendResult = "sent" | "skipped:no-provider" | "skipped:budget" | "failed";

const RESEND_URL = "https://api.resend.com/emails";

export function dailyBudget(): number {
  const n = Number.parseInt(process.env.EMAIL_DAILY_BUDGET ?? "80", 10);
  return Number.isFinite(n) && n > 0 ? n : 80;
}

export async function sentToday(): Promise<number> {
  const admin = createAdminClient();
  const since = new Date();
  since.setUTCHours(0, 0, 0, 0);
  const { count } = await admin.from("email_sends").select("id", { count: "exact", head: true }).eq("status", "sent").gte("created_at", since.toISOString());
  return count ?? 0;
}

export async function sendMail(mail: Mail, kind: string, universityId: string | null = null): Promise<SendResult> {
  const admin = createAdminClient();
  const recipientHash = createHash("sha256").update(mail.to.toLowerCase()).digest("hex");
  const record = (status: SendResult, provider: string) => admin.from("email_sends").insert({ university_id: universityId, kind, recipient_hash: recipientHash, status, provider });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!apiKey || !from) {
    await record("skipped:no-provider", "none");
    return "skipped:no-provider";
  }
  if ((await sentToday()) >= dailyBudget()) {
    await record("skipped:budget", "resend");
    return "skipped:budget";
  }
  const res = await fetch(RESEND_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text, html: mail.html }),
  });
  const status: SendResult = res.ok ? "sent" : "failed";
  await record(status, "resend");
  return status;
}
