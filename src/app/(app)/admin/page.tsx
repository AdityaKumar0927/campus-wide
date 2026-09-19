import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { Button } from "@/components/ui/button";
import { getCampus } from "@/lib/dal/campus";
import { AuthError, requireRole } from "@/lib/dal/session";
import { FLAG_KEYS } from "@/lib/moderation/constants";
import { setFlag } from "./actions";
import { CampusForm, PolicyForm, SpotsForm } from "./admin-forms";
import { AdminPeople, AdminSection } from "./people";

export const metadata: Metadata = { title: "Campus admin" };

const FLAG_LABEL: Record<string, string> = {
  questions: "Questions",
  events: "Events",
  market: "Marketplace",
  meals: "Meal gifting (off until Residence Life confirms, Decision M-5)",
  lost_found: "Lost & found",
  rides: "Rides",
  study: "Study groups",
  roommates: "Roommates",
  polls: "Polls",
  ai_server: "Server AI fallback (Groq): summaries, translation, triage labels, paste-to-event; input scrubbed of emails, phones, handles",
};

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ member?: string }> }) {
  let session;
  try {
    session = await requireRole("university_admin");
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? "/sign-in?next=/admin" : "/feed");
    throw e;
  }
  const { member } = await searchParams;
  const campus = await getCampus();
  if (!campus) redirect("/feed");

  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>{campus.shortName} · aggregate numbers only</Kicker>
        <h1 className="mt-1 text-5xl">Campus admin</h1>
      </header>

      <AdminSection id="modules" title="Modules">
        <ul className="grid gap-2 sm:grid-cols-2">
          {FLAG_KEYS.map((flag) => {
            const on = Boolean(campus.featureFlags[flag]);
            return (
              <li key={flag} className="flex items-center justify-between gap-3 rounded-md border border-rule px-3 py-2 text-sm">
                <span>{FLAG_LABEL[flag]}</span>
                <form action={setFlag.bind(null, flag, !on)}>
                  <Button type="submit" size="sm" variant={on ? "default" : "outline"} aria-pressed={on} aria-label={`${FLAG_LABEL[flag]}: ${on ? "on" : "off"}`}>
                    {on ? "On" : "Off"}
                  </Button>
                </form>
              </li>
            );
          })}
        </ul>
      </AdminSection>

      <AdminSection id="campus" title="Campus">
        <CampusForm name={campus.name} shortName={campus.shortName} accentHue={campus.accentHue} timezone={campus.timezone} />
      </AdminSection>

      <AdminSection id="policy" title="Policy text">
        <div className="space-y-4">
          <PolicyForm policyKey="meals" label="Meal sharing (shown before every offer)" text={campus.policyText.meals ?? ""} />
          <PolicyForm policyKey="market" label="Marketplace note (shown on listings)" text={campus.policyText.market ?? ""} />
        </div>
      </AdminSection>

      <AdminSection id="spots" title="Safe-exchange spots">
        <SpotsForm spots={campus.safeExchangeLocations} />
      </AdminSection>

      <AdminPeople member={member} selfId={session.userId} />

      <p className="text-xs text-muted-foreground">
        Public numbers for this campus live at{" "}
        <Link href="/campus/illinois-tech" className="underline underline-offset-4">
          /campus/illinois-tech
        </Link>
        .
      </p>
    </div>
  );
}
