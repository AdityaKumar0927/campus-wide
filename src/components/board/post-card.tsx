import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { TickIcon } from "@/components/icons/board-icons";
import type { PostWithAuthor } from "@/lib/dal/posts";
import { summaryLine } from "@/lib/posts/summary";
import { POST_TYPE_META, type PostType } from "@/lib/posts/types";
import { relativeTime } from "@/lib/text";
import { postImageUrl } from "@/lib/uploads/urls";
import { cn } from "@/lib/utils";
import { AuthorChip } from "./author-chip";

const rotations = ["-rotate-[0.6deg]", "rotate-[0.5deg]", "-rotate-[0.3deg]", "rotate-[0.8deg]", "-rotate-[0.9deg]", "rotate-[0.3deg]"];

/** A post as a pinned notice on the board. Server component; the whole card links to the thread. */
export function PostCard({ post, index = 0, now, spaceName }: { post: PostWithAuthor; index?: number; now?: Date; spaceName?: string | null }) {
  const meta = POST_TYPE_META[post.type as PostType];
  const images = (post.images as string[]) ?? [];
  const summary = summaryLine(post.type as PostType, post.payload);
  const excerpt = post.body.length > 180 ? `${post.body.slice(0, 180).trimEnd()}…` : post.body;
  const replies = post.type === "question" ? `${post.comment_count} answer${post.comment_count === 1 ? "" : "s"}` : `${post.comment_count} repl${post.comment_count === 1 ? "y" : "ies"}`;
  return (
    <li className="reveal">
      <article
        className={cn("notice flex h-full flex-col px-4 pt-5 pb-3", rotations[index % rotations.length])}
        style={{ "--stock": `var(--stock-${meta.stock})`, "--pin-hue": meta.pinHue } as CSSProperties}
        aria-labelledby={`post-${post.id}-title`}
      >
        <p className="stamp">
          {meta.label} · {relativeTime(post.created_at, now)}
          {spaceName ? ` · ${spaceName}` : ""}
          {post.status === "resolved" && post.type === "question" ? " · answered" : ""}
          {post.status === "expired" ? " · expired" : ""}
        </p>
        <h3 id={`post-${post.id}-title`} className="mt-2 text-lg leading-snug">
          <Link href={`/p/${post.id}`} className="outline-none after:absolute after:inset-0 after:content-[''] focus-visible:underline">
            {post.title}
          </Link>
        </h3>
        {summary && <p className="mt-1.5 text-sm font-medium">{summary}</p>}
        {excerpt && <p className="mt-1.5 text-sm whitespace-pre-line text-muted-foreground">{excerpt}</p>}
        {images[0] && (
          <div className="relative mt-3 aspect-[4/3] w-full overflow-hidden rounded-sm border border-rule bg-muted">
            <Image src={postImageUrl(images[0])} alt="" fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover" unoptimized />
          </div>
        )}
        <footer className="relative mt-auto flex flex-wrap items-center justify-between gap-2 pt-3 text-xs text-muted-foreground">
          <AuthorChip author={post.author} />
          <span className="flex items-center gap-3">
            {post.accepted_comment_id && (
              <span className="inline-flex items-center gap-1 font-medium text-primary">
                <TickIcon className="size-3.5" /> Accepted
              </span>
            )}
            <span>{replies}</span>
            <span>{post.thanks_count} thanks</span>
          </span>
        </footer>
      </article>
    </li>
  );
}
