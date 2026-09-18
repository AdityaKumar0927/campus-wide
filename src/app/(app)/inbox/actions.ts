"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function markAllRead(): Promise<void> {
  const supabase = await createClient();
  await supabase.rpc("mark_notifications_read");
  revalidatePath("/inbox");
  revalidatePath("/feed");
}
