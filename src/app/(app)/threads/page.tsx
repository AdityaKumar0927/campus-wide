import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { InboxIcon } from "@/components/icons/board-icons";
import { Kicker } from "@/components/kicker";
import { listMyThreads } from "@/lib/dal/modules";
import { getSession } from "@/lib/dal/session";
import { relativeTime } from "@/lib/text";

export const metadata: Metadata = { title: "Threads" };

export default async function ThreadsPage() {
  const [session, threads] = await Promise.all([getSession(), listMyThreads()]);
  const now = new Date();
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>Contact through the board</Kicker>
        <h1 className="mt-1 text-5xl">Threads</h1>
      </header>
      {threads.length === 0 ? (
        <EmptyState icon={InboxIcon} stock="manila" stamp="No tabs taken" title="No threads yet." description="Take a tab on a listing, a ride, or a lost-and-found notice and the conversation lands here." />
      ) : (
        <ol className="divide-y divide-rule rounded-md border border-rule bg-card" aria-label="Threads">
          {threads.map((t) => {
            const other = session?.userId === t.initiator_id ? t.owner : t.initiator;
            return (
              <li key={t.id} className="px-4 py-3">
                <p className="stamp">
                  {other?.display_name ?? "Former member"} · {t.last_message_at ? relativeTime(t.last_message_at, now) : "no messages"}
                  {t.state !== "open" ? ` · ${t.state}` : ""}
                  {t.flagged ? " · caution" : ""}
                </p>
                <Link href={`/t/${t.id}`} className="mt-0.5 block font-medium underline-offset-4 hover:underline">
                  {t.post?.title ?? "A notice that was taken down"}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
