import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PostList } from "@/components/board/post-list";
import { Kicker } from "@/components/kicker";
import { Button, buttonVariants } from "@/components/ui/button";
import { listPosts } from "@/lib/dal/posts";
import { getSpaceBySlug, mySpaceIds } from "@/lib/dal/spaces";
import { joinSpace, leaveSpace } from "../../spaces/actions";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const space = await getSpaceBySlug(slug).catch(() => null);
  return { title: space?.name ?? "Space" };
}

export default async function SpacePage({ params, searchParams }: { params: Promise<Params>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const space = await getSpaceBySlug(slug);
  if (!space) notFound();
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const [posts, mine] = await Promise.all([listPosts({ spaceId: space.id, page }), mySpaceIds()]);
  const joined = mine.has(space.id);
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <Kicker>
            Space · {space.member_count} member{space.member_count === 1 ? "" : "s"}
          </Kicker>
          <h1 className="mt-1 text-5xl">{space.name}</h1>
          {space.description && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{space.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <form action={(joined ? leaveSpace : joinSpace).bind(null, space.id, space.slug)}>
            <Button type="submit" variant={joined ? "outline" : "default"}>
              {joined ? "Leave" : "Join"}
            </Button>
          </form>
          <Link href={`/post?space=${space.id}`} className={buttonVariants({ variant: "outline" })}>
            Pin here
          </Link>
        </div>
      </header>
      <PostList
        page={posts}
        hrefForPage={(n) => (n > 1 ? `/s/${space.slug}?page=${n}` : `/s/${space.slug}`)}
        empty={{ title: `Nothing pinned in ${space.name} yet.`, description: "Be the first.", action: <Link href={`/post?space=${space.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>Pin a notice here</Link> }}
      />
    </div>
  );
}
