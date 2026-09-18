import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ComingSoonIllustration } from "@/components/illustrations";
import { Kicker } from "@/components/kicker";
import { buttonVariants } from "@/components/ui/button";
import { getCampus, typeEnabled } from "@/lib/dal/campus";
import { listPosts } from "@/lib/dal/posts";
import { POST_TYPE_META, type PostType } from "@/lib/posts/types";
import { FeedControls } from "./feed-controls";
import { PostList } from "./post-list";

type Sort = "new" | "helpful" | "active";

/** A module board: one or more post types, filters, paging, and a switched-off state per campus. */
export async function ModulePage({
  basePath,
  title,
  kicker,
  blurb,
  types,
  composeType,
  searchParams,
  offNote,
}: {
  basePath: string;
  title: string;
  kicker: string;
  blurb?: string;
  types: PostType[];
  composeType: PostType;
  searchParams: { page?: string; sort?: string; type?: string };
  offNote?: React.ReactNode;
}) {
  const campus = await getCampus();
  const enabled = types.some((t) => typeEnabled(campus?.featureFlags, t));
  const page = Math.max(1, Number.parseInt(searchParams.page ?? "1", 10) || 1);
  const sort: Sort = searchParams.sort === "helpful" || searchParams.sort === "active" ? searchParams.sort : "new";
  const type = types.includes(searchParams.type as PostType) ? (searchParams.type as PostType) : "all";
  const hrefForPage = (n: number) => {
    const params = new URLSearchParams();
    if (sort !== "new") params.set("sort", sort);
    if (type !== "all") params.set("type", type);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };

  if (!enabled) {
    return (
      <div className="space-y-6">
        <header className="border-b border-rule pb-4">
          <Kicker>{kicker}</Kicker>
          <h1 className="mt-1 text-5xl">{title}</h1>
        </header>
        <EmptyState illustration={<ComingSoonIllustration className="w-44" />} stock="manila" stamp="Switched off on this campus" title={`${title} is not open here yet.`} description={offNote ?? "The campus admin has not switched this module on."} />
      </div>
    );
  }

  const posts = await listPosts({ page, sort, types: type === "all" ? types : [type] });
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <Kicker>{kicker}</Kicker>
          <h1 className="mt-1 text-5xl">{title}</h1>
          {blurb && <p className="mt-2 max-w-xl text-sm text-muted-foreground">{blurb}</p>}
        </div>
        <Link href={`/post?type=${composeType}`} className={buttonVariants()}>
          Pin {POST_TYPE_META[composeType].label.toLowerCase() === "for sale" ? "a listing" : `a ${POST_TYPE_META[composeType].label.toLowerCase()}`}
        </Link>
      </header>
      <FeedControls basePath={basePath} sort={sort} type={type} types={types.length > 1 ? ["all", ...types] : ["all"]} />
      <PostList
        page={posts}
        hrefForPage={hrefForPage}
        empty={{
          title: `Nothing on the ${title.toLowerCase()} board yet.`,
          description: POST_TYPE_META[composeType].hint,
          action: (
            <Link href={`/post?type=${composeType}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              Be the first
            </Link>
          ),
        }}
      />
    </div>
  );
}
