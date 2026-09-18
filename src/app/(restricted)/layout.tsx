import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { getSession } from "@/lib/dal/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

/** Pages a sanctioned member must still reach: the suspended notice and the decision they can appeal. */
export default async function RestrictedLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (isSupabaseConfigured() && !session) redirect("/sign-in");
  return <AppShell session={session}>{children}</AppShell>;
}
