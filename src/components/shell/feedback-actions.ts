"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/dal/session";
import { sendMail } from "@/lib/email/send";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  sentiment: z.enum(["love", "good", "meh", "bad"]),
  message: z.string().trim().min(1, "Say something first.").max(2000, "Keep it under 2,000 characters."),
  pageUrl: z.string().max(500).optional(),
  consent: z.boolean().default(false),
});

export type FeedbackState = { error?: string; ok?: boolean };

/** Stores feedback, then forwards it to a GitHub issue or the admin mailbox when either is configured. */
export async function submitFeedback(_prev: FeedbackState, formData: FormData): Promise<FeedbackState> {
  const parsed = schema.safeParse({
    sentiment: formData.get("sentiment"),
    message: formData.get("message"),
    pageUrl: formData.get("pageUrl") ?? undefined,
    consent: formData.get("consent") === "on",
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the form." };
  const { sentiment, message, pageUrl, consent } = parsed.data;
  const session = await getSession();
  const h = await headers();
  const userAgent = consent ? (h.get("user-agent") ?? "").slice(0, 300) : null;
  // Members may insert but not read feedback rows, so the id is minted here and forwarding happens first.
  const id = randomUUID();
  const forwarded = await forward({ id, sentiment, message, pageUrl: consent ? pageUrl : undefined, userAgent: userAgent ?? undefined });
  const supabase = await createClient();
  const { error } = await supabase
    .from("feedback")
    .insert({ id, university_id: session?.universityId ?? null, user_id: session?.userId ?? null, sentiment, message, page_url: consent ? (pageUrl ?? null) : null, user_agent: userAgent, consent, forwarded_to: forwarded });
  if (error) return { error: "Could not save that. Try again." };
  return { ok: true };
}

async function forward(f: { id: string; sentiment: string; message: string; pageUrl?: string; userAgent?: string }): Promise<string | null> {
  const token = process.env.GITHUB_FEEDBACK_TOKEN;
  const repo = process.env.GITHUB_FEEDBACK_REPO;
  const body = `**Sentiment:** ${f.sentiment}\n\n${f.message}\n\n${f.pageUrl ? `Page: ${f.pageUrl}\n` : ""}${f.userAgent ? `Agent: ${f.userAgent}\n` : ""}Feedback id: ${f.id}`;
  if (token && repo) {
    try {
      const res = await fetch(`https://api.github.com/repos/${repo}/issues`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Feedback (${f.sentiment}): ${f.message.slice(0, 60)}`, body, labels: ["feedback"] }),
      });
      if (res.ok) {
        const issue = (await res.json()) as { html_url?: string };
        if (issue.html_url) return issue.html_url;
      }
    } catch {
      // fall through to email
    }
  }
  const to = process.env.FEEDBACK_ADMIN_EMAIL;
  if (to) {
    const result = await sendMail({ to, subject: `Campus Wide feedback (${f.sentiment})`, text: body }, "feedback");
    if (result === "sent") return `mailto:${to}`;
  }
  return null;
}
