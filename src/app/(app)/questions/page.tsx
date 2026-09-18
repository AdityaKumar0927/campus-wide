import type { Metadata } from "next";
import Link from "next/link";
import { FeedControls } from "@/components/board/feed-controls";
import { PostList } from "@/components/board/post-list";
import { Kicker } from "@/components/kicker";
import { buttonVariants } from "@/components/ui/button";
import { listPosts } from "@/lib/dal/posts";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Questions" };

type Sort = "new" | "helpful" | "active";

export default async function QuestionsPage({ searchParams }: { searchParams: Promise<{ page?: string; sort?: string; show?: string }> }) {
  const sp = await searchParams;
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const sort: Sort = sp.sort === "helpful" || sp.sort === "active" ? sp.sort : "new";
  const show = sp.show === "all" ? "all" : "open";
  const posts = await listPosts({ page, sort, type: "question", unansweredOnly: show === "open" });
  const hrefForPage = (n: number) => {
    const params = new URLSearchParams();
    if (sort !== "new") params.set("sort", sort);
    if (show !== "open") params.set("show", show);
    if (n > 1) params.set("page", String(n));
    const qs = params.toString();
    return qs ? `/questions?${qs}` : "/questions";
  };
  const tab = (key: "open" | "all", label: string) => (
    <Link
      href={key === "open" ? "/questions" : "/questions?show=all"}
      aria-current={show === key ? "page" : undefined}
      className={cn("border-b-2 px-1 pb-2 text-sm font-medium", show === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}
    >
      {label}
    </Link>
  );

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-rule pb-4">
        <div>
          <Kicker>Ask once, answer for everyone</Kicker>
          <h1 className="mt-1 text-5xl">Questions</h1>
        </div>
        <Link href="/post?type=question" className={buttonVariants()}>
          Ask a question
        </Link>
      </header>
      <nav aria-label="Show" className="flex gap-5 border-b border-rule">
        {tab("open", "Waiting for an answer")}
        {tab("all", "All questions")}
      </nav>
      <FeedControls basePath={show === "open" ? "/questions" : "/questions?show=all"} sort={sort} type="all" types={["all"]} extra={{ show: show === "all" ? "all" : undefined }} />
      <PostList
        page={posts}
        hrefForPage={hrefForPage}
        empty={{
          stamp: "Nothing waiting",
          title: show === "open" ? "Every question has an answer right now." : "No questions yet.",
          description: "Ask the thing you were too shy to ask at orientation.",
          action: (
            <Link href="/post?type=question" className={buttonVariants({ variant: "outline", size: "sm" })}>
              Ask a question
            </Link>
          ),
        }}
      />
    </div>
  );
}
