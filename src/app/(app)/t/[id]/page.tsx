import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmButton } from "@/components/board/confirm-button";
import { Kicker } from "@/components/kicker";
import { Button, buttonVariants } from "@/components/ui/button";
import { getCampus } from "@/lib/dal/campus";
import { getThread, listMessages, relayContact } from "@/lib/dal/modules";
import { getSession } from "@/lib/dal/session";
import { formatDateTime, linkify } from "@/lib/text";
import { cn } from "@/lib/utils";
import { blockOther, closeThread, confirmHappened, sendMessage, setShareEmail } from "./actions";
import { MessageForm } from "./message-form";

export const metadata: Metadata = { title: "Thread" };

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [thread, session, campus] = await Promise.all([getThread(id), getSession(), getCampus()]);
  if (!thread || !session) notFound();
  const role: "initiator" | "owner" = session.userId === thread.initiator_id ? "initiator" : "owner";
  const other = role === "initiator" ? thread.owner : thread.initiator;
  const otherId = role === "initiator" ? thread.owner_id : thread.initiator_id;
  const [messages, contact] = await Promise.all([listMessages(thread.id), relayContact(thread.id)]);
  const myShare = role === "initiator" ? thread.initiator_share_email : thread.owner_share_email;
  const theirShare = role === "initiator" ? thread.owner_share_email : thread.initiator_share_email;
  const myConfirm = role === "initiator" ? thread.initiator_confirmed_at : thread.owner_confirmed_at;
  const waiting = role === "initiator" && thread.message_count >= 1 && !messages.some((m) => m.sender_id === thread.owner_id);
  const open = thread.state === "open";
  const confirmable = thread.post?.type !== "roommate";

  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/threads" className="text-muted-foreground underline-offset-4 hover:underline">
          ← Threads
        </Link>
      </nav>
      <header className="border-b border-rule pb-4">
        <Kicker>
          {thread.state === "completed" ? "It happened" : thread.state === "closed" ? "Closed" : "Through the board"} · with {other?.display_name ?? "a former member"}
        </Kicker>
        <h1 className="mt-1 text-4xl">
          {thread.post ? (
            <Link href={`/p/${thread.post.id}`} className="underline-offset-4 hover:underline">
              {thread.post.title}
            </Link>
          ) : (
            "A notice that was taken down"
          )}
        </h1>
        {thread.post?.type === "listing" && campus && campus.safeExchangeLocations.length > 0 && (
          <p className="mt-2 text-sm text-muted-foreground">Meet at a safe-exchange spot: {campus.safeExchangeLocations.map((s) => s.name).join("; ")}.</p>
        )}
      </header>

      {thread.flagged && (
        <p role="status" className="rounded-md border border-rule bg-[var(--stock-yellow)] px-3 py-2 text-sm">
          A message here mentioned payment or moving off the app. Nothing on this board is paid for. If something feels off, block, and export this thread for a report.
        </p>
      )}

      <ol className="space-y-2" aria-label="Messages">
        {messages.length === 0 && <li className="text-sm text-muted-foreground">No messages yet. Say hello and suggest a public spot.</li>}
        {messages.map((m) => {
          const mine = m.sender_id === session.userId;
          return (
            <li key={m.id} className={cn("max-w-[85%] rounded-md border px-3 py-2 text-sm", mine ? "ml-auto border-primary/40 bg-accent/40" : "border-rule bg-card")}>
              <p className="stamp">
                {mine ? "You" : (other?.display_name ?? "Them")} · {formatDateTime(m.created_at)}
                {m.flagged_words.length > 0 ? " · caution" : ""}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{linkify(m.body)}</p>
            </li>
          );
        })}
      </ol>

      {open ? waiting ? <p className="text-sm text-muted-foreground">One message until they answer. You will hear in your inbox when they reply.</p> : <MessageForm action={sendMessage.bind(null, thread.id)} /> : null}

      <section aria-label="Sharing" className="grid gap-4 rounded-md border border-rule bg-card p-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="stamp">Addresses</p>
          <p className="text-sm">
            {contact?.email ? (
              <>
                Both agreed: <span className="font-mono">{contact.email}</span>
              </>
            ) : theirShare ? (
              `${other?.display_name ?? "They"} shared theirs. Share yours to see it.`
            ) : (
              "Appear only when both of you agree."
            )}
          </p>
          {open && (
            <form action={setShareEmail.bind(null, thread.id, role, !myShare)}>
              <Button type="submit" size="sm" variant={myShare ? "outline" : "default"} aria-pressed={myShare}>
                {myShare ? "Stop sharing my email" : "Share my email"}
              </Button>
            </form>
          )}
        </div>
        <div className="space-y-2">
          <p className="stamp">When it is done</p>
          {confirmable && (
            <>
              <p className="text-sm text-muted-foreground">Both tap this after the hand-off or the meal. The helper gets credit.</p>
              {myConfirm ? (
                <p className="text-sm">You confirmed. {thread.state === "completed" ? "So did they." : "Waiting for them."}</p>
              ) : (
                thread.state !== "completed" && (
                  <form action={confirmHappened.bind(null, thread.id, role)}>
                    <Button type="submit" size="sm" variant="outline">
                      It happened
                    </Button>
                  </form>
                )
              )}
            </>
          )}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {open && <ConfirmButton label="Close thread" confirmLabel="Close it" variant="ghost" onConfirm={closeThread.bind(null, thread.id)} />}
            <ConfirmButton label="Block" confirmLabel="Block them" variant="ghost" onConfirm={blockOther.bind(null, thread.id, otherId)} />
            <a href={`/t/${thread.id}/export`} className={buttonVariants({ variant: "ghost", size: "sm" })} download>
              Export for a report
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
