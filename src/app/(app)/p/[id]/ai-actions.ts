"use server";

import { complete, serverAiConfigured } from "@/lib/ai/groq";
import { getCampus } from "@/lib/dal/campus";
import { getPost, listComments } from "@/lib/dal/posts";
import { getSession } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

async function gate(): Promise<boolean> {
  const [session, campus] = await Promise.all([getSession(), getCampus()]);
  if (!session || !campus?.featureFlags.ai_server || !serverAiConfigured()) return false;
  const supabase = await createClient();
  const { error } = await supabase.rpc("take_rate_limit", { p_action: "ai", p_max: 30, p_window_seconds: 86400 });
  return !error;
}

async function threadText(postId: string): Promise<string | null> {
  const post = await getPost(postId);
  if (!post) return null;
  const comments = await listComments(postId);
  return [`Title: ${post.title}`, post.body, ...comments.map((c, i) => `Reply ${i + 1}${c.is_accepted ? " (accepted)" : ""}: ${c.body}`)].join("\n\n");
}

/** Server fallback for a thread summary (Groq). Null when the campus or the key is off. */
export async function summarizeThread(postId: string): Promise<string | null> {
  if (!(await gate())) return null;
  const text = await threadText(postId);
  if (!text) return null;
  return complete("Summarise this campus notice board thread in at most four short sentences. Plain text. Do not add anything that is not in the thread.", text, 220);
}

export async function translateThread(postId: string, language: string): Promise<string | null> {
  if (!(await gate())) return null;
  const text = await threadText(postId);
  if (!text) return null;
  const target = /^[a-zA-Z ]{2,30}$/.test(language) ? language : "English";
  return complete(`Translate this campus notice board thread into ${target}. Keep the structure (title, replies). Plain text only.`, text, 900);
}
