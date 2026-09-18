import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMail, type SendResult } from "./send";

/**
 * Weekly digest: the notices people thanked and answered most, per campus, to members who kept the
 * digest on. Everything else stays in the in-app inbox (ARCHITECTURE.md §9).
 */
export interface DigestSummary {
  universityId: string;
  recipients: number;
  sent: number;
  skipped: number;
  posts: number;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c);
}

export function renderDigest(campus: string, appUrl: string, posts: { id: string; title: string; type: string; comment_count: number; thanks_count: number }[]) {
  const lines = posts.map((p) => `- ${p.title} (${p.comment_count} replies, ${p.thanks_count} thanks)\n  ${appUrl}/p/${p.id}`);
  const text = `This week on the ${campus} board\n\n${lines.join("\n\n")}\n\nYou get this once a week because the digest is on in Settings. Turn it off any time: ${appUrl}/settings`;
  const items = posts
    .map((p) => `<li style="margin:0 0 12px"><a href="${appUrl}/p/${p.id}" style="color:#1f5c3f;font-weight:600;text-decoration:none">${escapeHtml(p.title)}</a><br><span style="color:#6b6258;font-size:13px">${p.comment_count} replies · ${p.thanks_count} thanks</span></li>`)
    .join("");
  const html = `<div style="font-family:Manrope,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#2b2622"><p style="font-size:13px;color:#6b6258;margin:0 0 6px">Campus Wide</p><h1 style="font-size:24px;font-weight:400;letter-spacing:-0.02em;margin:0 0 18px">This week on the ${escapeHtml(campus)} board</h1><ul style="padding-left:18px;margin:0 0 24px">${items}</ul><p style="font-size:12px;color:#6b6258">Once a week, because the digest is on in <a href="${appUrl}/settings" style="color:#6b6258">Settings</a>.</p></div>`;
  return { text, html };
}

export async function runWeeklyDigest(appUrl: string): Promise<DigestSummary[]> {
  const admin = createAdminClient();
  const periodEnd = new Date();
  const periodStart = new Date(periodEnd.getTime() - 7 * 86_400_000);
  const { data: universities } = await admin.from("universities").select("id, short_name, name").eq("status", "active");
  const summaries: DigestSummary[] = [];

  for (const u of universities ?? []) {
    const { data: posts } = await admin
      .from("posts")
      .select("id, title, type, comment_count, thanks_count")
      .eq("university_id", u.id)
      .in("status", ["active", "resolved"])
      .gte("created_at", periodStart.toISOString())
      .order("thanks_count", { ascending: false })
      .order("comment_count", { ascending: false })
      .limit(10);
    const top = posts ?? [];
    const summary: DigestSummary = { universityId: u.id, recipients: 0, sent: 0, skipped: 0, posts: top.length };
    if (top.length > 0) {
      const { data: members } = await admin
        .from("profiles")
        .select("user_id, email_digest, users!inner(email), memberships!inner(status)")
        .eq("university_id", u.id)
        .eq("email_digest", true)
        .eq("memberships.status", "active");
      const mail = renderDigest(u.short_name ?? u.name, appUrl, top);
      for (const m of (members ?? []) as unknown as { user_id: string; users: { email: string } }[]) {
        summary.recipients += 1;
        const result: SendResult = await sendMail({ to: m.users.email, subject: `This week on the ${u.short_name ?? u.name} board`, ...mail }, "digest", u.id);
        if (result === "sent") summary.sent += 1;
        else summary.skipped += 1;
      }
    }
    await admin.from("digest_runs").insert({ university_id: u.id, period_start: periodStart.toISOString(), period_end: periodEnd.toISOString(), recipients: summary.recipients, sent: summary.sent, skipped: summary.skipped, details: { posts: summary.posts } });
    summaries.push(summary);
  }
  return summaries;
}
