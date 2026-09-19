import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { pendingConsents } from "@/lib/dal/consents";
import { getSession } from "@/lib/dal/session";
import { acceptPolicies } from "./actions";
import { ConsentForm } from "./consent-form";

export const metadata: Metadata = { title: "Updated policies" };

/** Re-consent: a changed required policy is read and accepted before the board opens again. */
export default async function ConsentPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in?next=/consent");
  const pending = await pendingConsents();
  if (pending.length === 0) redirect("/feed");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>One minute, then back to the board</Kicker>
        <h1 className="mt-1 text-5xl">{pending.length === 1 ? "A policy changed" : "Some policies changed"}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Read what changed and accept to carry on. Your acceptance is recorded with the version, the time, and this device.</p>
      </header>
      <ul className="space-y-3">
        {pending.map((p) => (
          <li key={p.id} className="rounded-md border border-rule bg-card p-4">
            <p className="stamp">Version {p.version}</p>
            <Link href={`/policies/${p.slug}`} target="_blank" rel="noopener" className="font-medium underline underline-offset-4">
              {p.title}
            </Link>
            {p.summary && <p className="mt-1 text-sm text-muted-foreground">{p.summary}</p>}
          </li>
        ))}
      </ul>
      <ConsentForm ids={pending.map((p) => p.id)} action={acceptPolicies} />
    </div>
  );
}
