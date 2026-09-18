"use server";

import { revalidatePath } from "next/cache";
import { explainDbError } from "@/lib/dal/posts";
import { getSession } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

export type AppealState = { error?: string; ok?: boolean };

export async function fileAppeal(actionId: string, _prev: AppealState, formData: FormData): Promise<AppealState> {
  const session = await getSession();
  if (!session) return { error: "Sign in first." };
  const text = String(formData.get("text") ?? "").trim();
  if (text.length < 10) return { error: "Say a little more (at least ten characters)." };
  if (text.length > 4000) return { error: "Keep it under 4,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase.rpc("appeal", { p_action_id: actionId, p_text: text });
  if (error) return { error: /window has closed/.test(error.message) ? "The 14-day appeal window has closed." : /already/.test(error.message) ? "This decision was already reversed." : /duplicate|unique/i.test(error.message) ? "You already appealed this decision." : explainDbError(error.message) };
  revalidatePath(`/appeals/${actionId}`);
  return { ok: true };
}
