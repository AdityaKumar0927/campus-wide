import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { AnswerForm } from "@/components/board/answer-form";
import { AuthorChip } from "@/components/board/author-chip";
import { CommentList } from "@/components/board/comment-list";
import { ConfirmButton } from "@/components/board/confirm-button";
import { ThanksButton } from "@/components/board/thanks-button";
import { ThreadSummary } from "@/components/board/thread-summary";
import { TypePanel } from "@/components/board/type-panels";
import { Kicker } from "@/components/kicker";
import { Button } from "@/components/ui/button";
import { serverAiConfigured } from "@/lib/ai/groq";
import { getCampus } from "@/lib/dal/campus";
import { getPost, listComments, myThanks } from "@/lib/dal/posts";
import { getSession } from "@/lib/dal/session";
import { getSpaceById } from "@/lib/dal/spaces";
import { POST_TYPE_META, type PostType } from "@/lib/posts/types";
import { formatDateTime, linkify, relativeTime } from "@/lib/text";
import { postImageUrl } from "@/lib/uploads/urls";
import { acceptAnswer, addComment, deleteComment, setPostStatus, toggleThanks } from "./actions";
import { summarizeThread, translateThread } from "./ai-actions";

type Params = { id: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id).catch(() => null);
  return { title: post ? post.title : "Notice" };
}

export default async function PostPage({ params }: { params: Promise<Params> }) {
  const { id } = await params;
  const [post, session, campus] = await Promise.all([getPost(id), getSession(), getCampus()]);
  if (!post) notFound();
  const [comments, space] = await Promise.all([listComments(post.id), post.space_id ? getSpaceById(post.space_id) : null]);
  const thanked = await myThanks([post.id, ...comments.map((c) => c.id)]);
  const meta = POST_TYPE_META[post.type as PostType];
  const isOwner = Boolean(session && session.userId === post.author_id);
  const role = session?.membership?.campusRole;
  const isModerator = role === "moderator" || role === "university_admin";
  const isQuestion = post.type === "question";
  const images = (post.images as string[]) ?? [];
  const open = post.status === "active" || post.status === "resolved";
  const serverAi = Boolean(campus?.featureFlags.ai_server) && serverAiConfigured();
  const threadText = [post.title, post.body, ...comments.map((c) => c.body)].join("\n\n");
  const status =
    post.status === "resolved" ? (isQuestion ? " · answered" : " · resolved") : post.status === "expired" ? " · expired" : post.status === "removed" ? " · removed by a moderator" : "";

  return (
    <div className="space-y-8">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href={isQuestion ? "/questions" : "/feed"} className="text-muted-foreground underline-offset-4 hover:underline">
          ← {isQuestion ? "Questions" : "Feed"}
        </Link>
      </nav>

      <article className="notice px-5 pt-6 pb-5 md:px-7" style={{ "--stock": `var(--stock-${meta.stock})`, "--pin-hue": meta.pinHue } as CSSProperties} aria-labelledby="post-title">
        <Kicker>
          {meta.label} · {relativeTime(post.created_at)}
          {space ? ` · ${space.name}` : ""}
          {status}
        </Kicker>
        <h1 id="post-title" className="mt-3 text-4xl md:text-5xl">
          {post.title}
        </h1>
        {post.body && <p className="mt-4 whitespace-pre-wrap text-[15px] leading-relaxed">{linkify(post.body)}</p>}
        {images.length > 0 && (
          <ul className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3" aria-label="Photos">
            {images.map((p) => (
              <li key={p} className="relative aspect-[4/3] overflow-hidden rounded-sm border border-rule bg-muted">
                <Image src={postImageUrl(p)} alt="" fill sizes="(min-width: 768px) 240px, 50vw" className="object-cover" unoptimized />
              </li>
            ))}
          </ul>
        )}
        <footer className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule/70 pt-4">
          <AuthorChip author={post.author} when={formatDateTime(post.created_at)} />
          <div className="flex flex-wrap items-center gap-2">
            {session && open && !isOwner && (
              <ThanksButton count={post.thanks_count} pressed={thanked.has(post.id)} label="Thank the author" onToggle={toggleThanks.bind(null, post.id, "post", post.id)} />
            )}
            {isOwner && !isQuestion && post.status === "active" && (
              <form action={setPostStatus.bind(null, post.id, "resolved")}>
                <Button type="submit" size="sm" variant="outline">
                  Mark resolved
                </Button>
              </form>
            )}
            {isOwner && !isQuestion && post.status === "resolved" && (
              <form action={setPostStatus.bind(null, post.id, "active")}>
                <Button type="submit" size="sm" variant="outline">
                  Reopen
                </Button>
              </form>
            )}
            {isOwner && <ConfirmButton label="Take it down" confirmLabel="Yes, take it down" onConfirm={setPostStatus.bind(null, post.id, "deleted")} />}
            {isModerator && !isOwner && post.status !== "removed" && (
              <ConfirmButton label="Remove (moderator)" confirmLabel="Remove this notice" onConfirm={setPostStatus.bind(null, post.id, "removed")} />
            )}
          </div>
        </footer>
      </article>

      {post.type !== "question" && post.type !== "notice" && (
        <div className="rounded-md border border-rule bg-card p-4">
          <TypePanel post={post} session={session} campus={campus} />
        </div>
      )}

      {session && comments.length >= 2 && <ThreadSummary text={threadText} serverAi={serverAi} onSummarize={summarizeThread.bind(null, post.id)} onTranslate={translateThread.bind(null, post.id)} />}

      <CommentList
        postId={post.id}
        comments={comments}
        isQuestion={isQuestion}
        open={open}
        viewerId={session?.userId ?? null}
        isOwner={isOwner}
        thanked={thanked}
        onThanks={toggleThanks}
        onAccept={acceptAnswer}
        onDelete={deleteComment}
      />

      {session && open ? (
        <section aria-labelledby="reply-heading" className="rounded-md border border-rule bg-card p-4">
          <h2 id="reply-heading" className="sr-only">
            {isQuestion ? "Answer" : "Reply"}
          </h2>
          <AnswerForm
            action={addComment.bind(null, post.id)}
            label={isQuestion ? "Your answer" : "Your reply"}
            placeholder={isQuestion ? "What do you know that would help?" : "Add something useful."}
            submitLabel={isQuestion ? "Post my answer" : "Post reply"}
          />
        </section>
      ) : (
        !open && <p className="text-sm text-muted-foreground">This notice is closed.</p>
      )}

      <p className="text-xs text-muted-foreground">
        Something wrong here?{" "}
        <Link href={`/report?type=post&id=${post.id}`} className="underline underline-offset-4">
          Report this notice
        </Link>
        {" "}or read the{" "}
        <Link href="/#safety" className="underline underline-offset-4">
          house rules
        </Link>
        .
      </p>
    </div>
  );
}
