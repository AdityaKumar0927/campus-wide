import { redirect } from "next/navigation";
import { AppShell } from "@/components/shell/app-shell";
import { pendingConsents } from "@/lib/dal/consents";
import { getSession } from "@/lib/dal/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (isSupabaseConfigured()) {
    if (!session) redirect("/sign-in");
    if (session.namePending || !session.profile?.onboardedAt) redirect("/onboarding");
    if (session.membership?.status === "banned") redirect("/suspended");
    if ((await pendingConsents()).length > 0) redirect("/consent");
  }
  return <AppShell session={session}>{children}</AppShell>;
}
