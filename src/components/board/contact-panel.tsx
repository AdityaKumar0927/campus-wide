import Link from "next/link";
import { joinPost, leavePost, openThread } from "@/app/(app)/p/[id]/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import type { Campus } from "@/lib/dal/campus";
import { listParticipants, listThreadsForPost, myThreadForPost } from "@/lib/dal/modules";
import type { PostWithAuthor } from "@/lib/dal/posts";
import type { Session } from "@/lib/dal/session";
import { AuthorChip } from "./author-chip";

export type Facts = [string, string | null | undefined][];

export function FactList({ facts }: { facts: Facts }) {
  const rows = facts.filter(([, v]) => v);
  if (rows.length === 0) return null;
  return (
    <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-2">
          <dt className="w-24 shrink-0 text-muted-foreground">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Contact through the board: the owner sees who took a tab; everyone else can take one. */
export async function ContactPanel({ post, session, campus, verb, note }: { post: PostWithAuthor; session: Session | null; campus: Campus | null; verb: string; note?: string }) {
  if (!session) return null;
  const isOwner = session.userId === post.author_id;
  const open = post.status === "active" || post.status === "resolved";
  if (isOwner) {
    const threads = await listThreadsForPost(post.id);
    return (
      <div className="space-y-2">
        <p className="stamp">{threads.length === 0 ? "No tabs taken yet" : `${threads.length} tab${threads.length === 1 ? "" : "s"} taken`}</p>
        <ul className="space-y-1">
          {threads.map((t) => (
            <li key={t.id}>
              <Link href={`/t/${t.id}`} className="text-sm underline-offset-4 hover:underline">
                {t.initiator?.display_name ?? "Former member"} · {t.message_count} message{t.message_count === 1 ? "" : "s"}
                {t.state !== "open" ? ` · ${t.state}` : ""}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  const mine = await myThreadForPost(post.id);
  return (
    <div className="space-y-2">
      {mine ? (
        <Link href={`/t/${mine.id}`} className={buttonVariants()}>
          Open your thread
        </Link>
      ) : open ? (
        <form action={openThread.bind(null, post.id)}>
          <Button type="submit">{verb}</Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">This notice is closed.</p>
      )}
      <p className="text-xs text-muted-foreground">{note ?? "Your message travels through the board. Nobody sees an email unless you both choose to share it."}</p>
      {post.type === "listing" && campus && campus.safeExchangeLocations.length > 0 && (
        <p className="text-xs text-muted-foreground">Hand-off spots: {campus.safeExchangeLocations.map((s) => s.name).join("; ")}.</p>
      )}
    </div>
  );
}

export async function Participation({ post, session, capacity, verb, leaveVerb, noun }: { post: PostWithAuthor; session: Session | null; capacity: number | null; verb: string; leaveVerb: string; noun: string }) {
  const people = await listParticipants(post.id);
  const mine = session ? people.some((p) => p.user_id === session.userId) : false;
  const isOwner = session?.userId === post.author_id;
  const left = capacity === null ? null : Math.max(0, capacity - people.length);
  const open = post.status === "active";
  return (
    <div className="space-y-3">
      <p className="stamp">
        {people.length} {noun}
        {left !== null ? ` · ${left} left` : ""}
      </p>
      {people.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label={noun}>
          {people.map((p) => (
            <li key={p.id}>
              <AuthorChip author={p.profile} />
            </li>
          ))}
        </ul>
      )}
      {session && !isOwner && open && (
        <form action={(mine ? leavePost : joinPost).bind(null, post.id)}>
          <Button type="submit" variant={mine ? "outline" : "default"} disabled={!mine && left === 0}>
            {mine ? leaveVerb : left === 0 ? "Full" : verb}
          </Button>
        </form>
      )}
    </div>
  );
}
