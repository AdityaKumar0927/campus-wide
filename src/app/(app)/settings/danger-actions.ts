"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { getSession } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";

export type DeletionState = { error?: string; scheduledFor?: string };

/**
 * Account deletion (docs/BRIEF.md §7): content is anonymised, identity purged after 30 days, and
 * threads you were reported in stay under a pseudonymous key. Cancelling inside the window restores
 * everything. The member must type the words, so nobody does this by accident.
 */
export async function requestDeletion(_prev: DeletionState, formData: FormData): Promise<DeletionState> {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/settings");
  if (String(formData.get("confirm") ?? "").trim().toLowerCase() !== "delete my account") {
    return { error: 'Type "delete my account" to confirm.' };
  }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("request_account_deletion");
  if (error) return { error: "Could not start the deletion. Try again." };
  const form = new FormData();
  form.set("scope", "global");
  await signOut(form);
  return { scheduledFor: data ?? undefined };
}

export async function cancelDeletion(): Promise<void> {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/settings");
  const supabase = await createClient();
  await supabase.rpc("cancel_account_deletion");
  revalidatePath("/settings");
  revalidatePath("/", "layout");
}
