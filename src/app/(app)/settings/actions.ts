"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireMember } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

export async function revokeSession(formData: FormData) {
  await requireMember();
  const id = z.string().uuid().safeParse(formData.get("id"));
  if (!id.success) return;
  const supabase = await createClient();
  await supabase.rpc("revoke_my_session", { session_id: id.data });
  revalidatePath("/settings");
}

export async function setPrivacyMode(formData: FormData) {
  const session = await requireMember();
  const on = formData.get("privacy_mode") === "on";
  const supabase = await createClient();
  await supabase.from("profiles").update({ privacy_mode: on }).eq("user_id", session.userId);
  revalidatePath("/settings");
}
