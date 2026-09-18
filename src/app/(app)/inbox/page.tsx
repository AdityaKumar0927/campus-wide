import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { InboxIcon } from "@/components/icons/board-icons";
import { Kicker } from "@/components/kicker";
import { Button } from "@/components/ui/button";
import { listNotifications } from "@/lib/dal/notifications";
import { getSession } from "@/lib/dal/session";
import { relativeTime } from "@/lib/text";
import { cn } from "@/lib/utils";
import { markAllRead } from "./actions";
import { InboxLive } from "./inbox-live";

export const metadata: Metadata = { title: "Inbox" };

export default async function InboxPage() {
  const [session, items] = await Promise.all([getSession(), listNotifications()]);
  const unread = items.filter((n) => !n.read_at).length;
  const now = new Date();
  return (
    <div className="space-y-6">
      {session && <InboxLive userId={session.userId} />}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <Kicker>{unread === 0 ? "All read" : `${unread} unread`}</Kicker>
          <h1 className="mt-1 text-5xl">Inbox</h1>
        </div>
        {unread > 0 && (
          <form action={markAllRead}>
            <Button type="submit" variant="outline" size="sm">
              Mark all read
            </Button>
          </form>
        )}
      </header>
      {items.length === 0 ? (
        <EmptyState icon={InboxIcon} stock="white" stamp="Nothing yet" title="Quiet inbox." description="Answers, thank-yous, and replies to your notices land here. No nudges." />
      ) : (
        <ol className="divide-y divide-rule rounded-md border border-rule bg-card" aria-label="Notifications">
          {items.map((n) => (
            <li key={n.id} className={cn("px-4 py-3", !n.read_at && "bg-accent/40")}>
              <p className="stamp">
                {relativeTime(n.created_at, now)}
                {!n.read_at && (
                  <>
                    <span className="ml-2 inline-block size-1.5 rounded-full bg-primary align-middle" aria-hidden />
                    <span className="sr-only"> unread</span>
                  </>
                )}
              </p>
              {n.href ? (
                <Link href={n.href} className="mt-0.5 block font-medium underline-offset-4 hover:underline">
                  {n.title}
                </Link>
              ) : (
                <p className="mt-0.5 font-medium">{n.title}</p>
              )}
              {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
