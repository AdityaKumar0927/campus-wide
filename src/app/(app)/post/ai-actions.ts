"use server";

import { z } from "zod";
import { complete, serverAiConfigured } from "@/lib/ai/groq";
import { getCampus } from "@/lib/dal/campus";
import { getSession } from "@/lib/dal/session";
import { localToIso } from "@/lib/posts/payload-from-form";
import { createClient } from "@/lib/supabase/server";

export interface SimilarQuestion {
  id: string;
  title: string;
  status: string;
  comment_count: number;
  accepted: boolean;
  similarity: number;
}

const vectorSchema = z.array(z.number().finite()).length(384);

/** Nearest existing questions for an embedding computed on the device. Empty when AI is off. */
export async function findSimilarQuestions(vector: number[]): Promise<SimilarQuestion[]> {
  const session = await getSession();
  if (!session) return [];
  const parsed = vectorSchema.safeParse(vector);
  if (!parsed.success) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("match_questions", { p_embedding: JSON.stringify(parsed.data), p_limit: 3 });
  return (data ?? [])
    .filter((r) => r.similarity >= 0.55)
    .map((r) => ({ id: r.id, title: r.title, status: r.status, comment_count: r.comment_count, accepted: Boolean(r.accepted_comment_id), similarity: r.similarity }));
}

export interface ExtractedEvent {
  title: string;
  startsAt: string;
  endsAt?: string;
  location: string;
  description: string;
}

/** Paste an announcement, get the fields (Groq, opt-in per campus, PII scrubbed). Null when off. */
export async function extractEventFromText(text: string): Promise<ExtractedEvent | null> {
  const session = await getSession();
  const campus = await getCampus();
  if (!session || !campus?.featureFlags.ai_server || !serverAiConfigured()) return null;
  const supabase = await createClient();
  const { error: limited } = await supabase.rpc("take_rate_limit", { p_action: "ai", p_max: 30, p_window_seconds: 86400 });
  if (limited) return null;
  const raw = await complete(
    `Extract one event from the text. Reply with JSON only: {"title": string, "startsAt": "YYYY-MM-DDTHH:MM" in local campus time, "endsAt": "YYYY-MM-DDTHH:MM" or null, "location": string, "description": string (one or two sentences)}. Today is ${new Date().toISOString().slice(0, 10)}. If there is no event, reply null.`,
    text.slice(0, 4000),
    400,
  );
  if (!raw) return null;
  try {
    const json = JSON.parse(raw.replace(/^```(?:json)?|```$/g, "").trim()) as Partial<ExtractedEvent> | null;
    if (!json?.title || !json.startsAt) return null;
    const startsAt = localToIso(String(json.startsAt), campus.timezone) ? String(json.startsAt).slice(0, 16) : "";
    if (!startsAt) return null;
    return {
      title: String(json.title).slice(0, 200),
      startsAt,
      endsAt: json.endsAt ? String(json.endsAt).slice(0, 16) : undefined,
      location: String(json.location ?? "").slice(0, 200),
      description: String(json.description ?? "").slice(0, 2000),
    };
  } catch {
    return null;
  }
}
