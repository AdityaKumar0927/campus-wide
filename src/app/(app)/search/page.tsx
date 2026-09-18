import type { Metadata } from "next";
import { PostCard } from "@/components/board/post-card";
import { Kicker } from "@/components/kicker";
import { Button } from "@/components/ui/button";
import { searchPosts } from "@/lib/dal/posts";

export const metadata: Metadata = { title: "Search" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim();
  const results = term.length >= 2 ? await searchPosts(term) : [];
  const now = new Date();
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>Everything pinned on this campus</Kicker>
        <h1 className="mt-1 text-5xl">Search</h1>
      </header>
      <form action="/search" method="get" role="search" className="flex gap-2">
        <label htmlFor="q" className="sr-only">
          Search the board
        </label>
        <input id="q" name="q" type="search" defaultValue={q} placeholder="shuttle, TI-84, sublet" className="h-10 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        <Button type="submit">Search</Button>
      </form>
      {term.length >= 2 && (
        <p className="stamp" aria-live="polite">
          {results.length === 0 ? `Nothing matches ${term}.` : `${results.length} result${results.length === 1 ? "" : "s"} for ${term}`}
        </p>
      )}
      {results.length > 0 && (
        <ul className="board grid gap-6 rounded-2xl border border-rule p-5 sm:grid-cols-2" aria-label="Results">
          {results.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} now={now} />
          ))}
        </ul>
      )}
    </div>
  );
}
