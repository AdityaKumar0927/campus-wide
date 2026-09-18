import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { buttonVariants } from "@/components/ui/button";
import { publicStats } from "@/lib/dal/moderation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${slug} campus numbers` };
}

const LABEL: Record<string, string> = { questions: "Questions", events: "Events", market: "Marketplace", meals: "Meal gifting", lost_found: "Lost & found", rides: "Rides", study: "Study groups", roommates: "Roommates", polls: "Polls" };

/** Public, aggregate, and honest: groups under ten are never shown. */
export default async function CampusStatsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const stats = await publicStats(slug);
  if (!stats) notFound();
  const n = (k: string) => (typeof stats[k] === "number" ? (stats[k] as number).toLocaleString("en-US") : "under 10");
  const modules = Array.isArray(stats.modules) ? (stats.modules as string[]) : [];
  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <Kicker>Campus numbers, aggregate only</Kicker>
      <h1 className="mt-3 text-5xl md:text-6xl">{String(stats.name)}</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">What the board is doing for this campus. Nothing here identifies a student, and any group smaller than ten shows as under 10.</p>
      <dl className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Verified members", n("members")],
          ["Notices in 30 days", n("notices_last_30_days")],
          ["Questions asked", n("questions")],
          ["Questions answered", typeof stats.answered_share === "number" ? `${stats.answered_share}%` : "under 10"],
          ["Times someone was helped", n("people_helped")],
        ].map(([k, v]) => (
          <div key={k} className="border-l-2 border-primary pl-3">
            <dt className="text-sm text-muted-foreground">{k}</dt>
            <dd className="font-heading text-4xl">{v}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-10">
        <h2 className="text-2xl">Modules switched on</h2>
        <ul className="mt-3 flex flex-wrap gap-2">
          {modules.map((m) => (
            <li key={m} className="rounded-full border border-rule bg-card px-3 py-1 text-sm">
              {LABEL[m] ?? m}
            </li>
          ))}
        </ul>
      </section>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/sign-in" className={buttonVariants()}>
          Sign in with your campus email
        </Link>
        <Link href="/#safety" className={buttonVariants({ variant: "outline" })}>
          House rules
        </Link>
      </div>
    </div>
  );
}
