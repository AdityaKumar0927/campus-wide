"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { findSimilarQuestions, type SimilarQuestion } from "@/app/(app)/post/ai-actions";
import { embed } from "@/lib/ai/client";

/**
 * "Already asked?" Computes the embedding on the device (never on page load), asks the database for
 * the nearest questions, and hands the vector to the form so the new question is searchable too.
 * Renders nothing until there is something to show; never blocks posting.
 */
export function DuplicateSuggestions({ title }: { title: string }) {
  const [matches, setMatches] = useState<SimilarQuestion[]>([]);
  const [vector, setVector] = useState<number[] | null>(null);
  const latest = useRef(0);

  useEffect(() => {
    const text = title.trim();
    if (text.length < 12) return;
    const run = ++latest.current;
    const timer = setTimeout(async () => {
      const v = await embed(text);
      if (run !== latest.current) return;
      if (!v) return;
      setVector(v);
      const found = await findSimilarQuestions(v);
      if (run === latest.current) setMatches(found);
    }, 700);
    return () => clearTimeout(timer);
  }, [title]);

  return (
    <>
      {vector && <input type="hidden" name="embedding" value={JSON.stringify(vector)} />}
      {matches.length > 0 && (
        <aside aria-label="Similar questions" className="rounded-md border border-rule bg-[var(--stock-yellow)] px-3 py-2 text-sm">
          <p className="stamp">Already asked?</p>
          <ul className="mt-1 space-y-1">
            {matches.map((m) => (
              <li key={m.id}>
                <Link href={`/p/${m.id}`} className="underline underline-offset-4" target="_blank" rel="noopener">
                  {m.title}
                </Link>
                <span className="text-xs text-muted-foreground">
                  {" "}
                  · {m.comment_count} answer{m.comment_count === 1 ? "" : "s"}
                  {m.accepted ? " · accepted" : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-1 text-xs text-muted-foreground">Matched on your device. Ask anyway if none of these fit.</p>
        </aside>
      )}
    </>
  );
}
