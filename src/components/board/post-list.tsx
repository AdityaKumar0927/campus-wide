import Link from "next/link";
import { EmptyBoardIllustration } from "@/components/illustrations";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";
import type { Page, PostWithAuthor } from "@/lib/dal/posts";
import { PostCard } from "./post-card";

/**
 * A page of notices on the board plus a "next page" link. There is no infinite scroll on purpose
 * (docs/BRIEF.md §8): every page ends, and the next one is a deliberate click.
 */
export function PostList({
  page,
  hrefForPage,
  spaceNames,
  empty,
}: {
  page: Page<PostWithAuthor>;
  hrefForPage: (n: number) => string;
  spaceNames?: Map<string, string>;
  empty?: { title: string; description?: string; action?: React.ReactNode; stamp?: string };
}) {
  const now = new Date();
  if (page.items.length === 0 && page.page === 1) {
    return (
      <EmptyState
        illustration={<EmptyBoardIllustration className="w-44" />}
        stock="blue"
        stamp={empty?.stamp ?? "Nothing pinned yet"}
        title={empty?.title ?? "Quiet today. That is allowed."}
        description={empty?.description}
        action={empty?.action}
      />
    );
  }
  return (
    <div>
      <ul className="board grid gap-6 rounded-2xl border border-rule p-5 sm:grid-cols-2 md:gap-7 md:p-6" aria-label="Notices">
        {page.items.map((post, i) => (
          <PostCard key={post.id} post={post} index={i} now={now} spaceName={post.space_id ? spaceNames?.get(post.space_id) : null} />
        ))}
      </ul>
      <nav aria-label="Pages" className="mt-6 flex items-center justify-between text-sm">
        {page.page > 1 ? (
          <Link href={hrefForPage(page.page - 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Newer
          </Link>
        ) : (
          <span />
        )}
        <span className="stamp">Page {page.page}</span>
        {page.hasNext ? (
          <Link href={hrefForPage(page.page + 1)} className={buttonVariants({ variant: "outline", size: "sm" })}>
            Load the next page
          </Link>
        ) : (
          <span className="stamp">End of the board</span>
        )}
      </nav>
    </div>
  );
}
