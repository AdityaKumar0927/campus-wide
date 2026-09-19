import Link from "next/link";
import { AuthorChip } from "@/components/board/author-chip";
import { ConfirmButton } from "@/components/board/confirm-button";
import { ThanksButton } from "@/components/board/thanks-button";
import { TickIcon } from "@/components/icons/board-icons";
import { Button } from "@/components/ui/button";
import type { CommentWithAuthor } from "@/lib/dal/posts";
import { linkify, relativeTime } from "@/lib/text";
import { cn } from "@/lib/utils";

interface Props {
  postId: string;
  comments: CommentWithAuthor[];
  isQuestion: boolean;
  open: boolean;
  viewerId: string | null;
  isOwner: boolean;
  thanked: Set<string>;
  onThanks: (postId: string, targetType: "post" | "comment", targetId: string) => Promise<boolean>;
  onAccept: (postId: string, commentId: string) => Promise<void>;
  onDelete: (postId: string, commentId: string) => Promise<void>;
}

/** Answers under a question (accepted first) or replies under a notice. */
export function CommentList({ postId, comments, isQuestion, open, viewerId, isOwner, thanked, onThanks, onAccept, onDelete }: Props) {
  const now = new Date();
  const noun = isQuestion ? "answer" : "reply";
  return (
    <section aria-labelledby="answers-heading" className="space-y-4">
      <h2 id="answers-heading" className="text-2xl">
        {comments.length} {isQuestion ? (comments.length === 1 ? "answer" : "answers") : comments.length === 1 ? "reply" : "replies"}
      </h2>
      {comments.length === 0 && <p className="text-sm text-muted-foreground">{isQuestion ? "No answers yet. Know something? Say it below." : "No replies yet."}</p>}
      <ol className="space-y-3">
        {comments.map((c) => (
          <li key={c.id} id={`c-${c.id}`} className={cn("rounded-md border bg-card p-4", c.is_accepted ? "border-primary/60 ring-1 ring-primary/30" : "border-rule")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <AuthorChip author={c.author} when={relativeTime(c.created_at, now)} />
              {c.is_accepted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                  <TickIcon className="size-3.5" /> Accepted answer
                </span>
              )}
            </div>
            <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{linkify(c.body)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {viewerId && (
                <ThanksButton count={c.thanks_count} pressed={thanked.has(c.id)} label={`Thank you to ${c.author?.display_name ?? "this member"} for this ${noun}`} onToggle={onThanks.bind(null, postId, "comment", c.id)} />
              )}
              {isOwner && isQuestion && !c.is_accepted && open && (
                <form action={onAccept.bind(null, postId, c.id)}>
                  <Button type="submit" size="sm" variant="outline">
                    Accept this answer
                  </Button>
                </form>
              )}
              {viewerId === c.author_id && <ConfirmButton label="Delete" confirmLabel={`Delete my ${noun}`} variant="ghost" onConfirm={onDelete.bind(null, postId, c.id)} />}
              {viewerId && viewerId !== c.author_id && (
                <Link href={`/report?type=comment&id=${c.id}`} className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                  Report
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
