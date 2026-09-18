import type { Metadata } from "next";
import Link from "next/link";
import { FeedControls } from "@/components/board/feed-controls";
import { PostList } from "@/components/board/post-list";
import { Kicker } from "@/components/kicker";
import { buttonVariants } from "@/components/ui/button";
import { listPosts } from "@/lib/dal/posts";
import { listSpaces } from "@/lib/dal/spaces";
import { POST_TYPES, type PostType } from "@/lib/posts/types";

export const metadata: Metadata = { title: "Feed" };

type Sort = "new" | "helpful" | "active";

export default async function FeedPage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; type?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const sort: Sort = sp.sort === "helpful" || sp.sort === "active" ? sp.sort : "new";
  const type = POST_TYPES.includes(sp.type as PostType) ? (sp.type as PostType) : "all";
  const [posts, spaces] = await Promise.all([listPosts({ page, sort, type }), listSpaces()]);
  const spaceNames = new Map(spaces.map((s) => [s.id, s.name]));
  const hrefForPage = (n: number) => {
    const params = new URLSearchParams();
    if (sort !== "new") params.set("sort", sort);
    if (type !== "all") params.set("type", type);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `/feed?${qs}` : "/feed";
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <Kicker>Illinois Tech</Kicker>
          <h1 className="mt-1 text-5xl">Feed</h1>
        </div>
        <Link href="/post" className={buttonVariants()}>
          Pin a notice
        </Link>
      </header>
      <FeedControls basePath="/feed" sort={sort} type={type} types={["all", "question", "notice"]} />
      <PostList
        page={posts}
        hrefForPage={hrefForPage}
        spaceNames={spaceNames}
        empty={{
          title: "Quiet today. That is allowed.",
          description: "Be the first to pin something: a question, a heads-up, a thing to give away.",
          action: (
            <Link href="/post" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Pin the first notice
            </Link>
          ),
        }}
      />
    </div>
  );
}
