"use client";

import { useOptimistic, useTransition } from "react";
import { cn } from "@/lib/utils";

/** Vote on a poll and watch the bars move. One ballot per student; changeable while it is open. */
export function PollVote({
  options,
  multiple,
  results,
  mine,
  open,
  onVote,
}: {
  options: string[];
  multiple: boolean;
  results: Record<number, number>;
  mine: number[] | null;
  open: boolean;
  onVote: (options: number[]) => Promise<void>;
}) {
  const [state, setState] = useOptimistic({ results, mine });
  const [pending, startTransition] = useTransition();
  const total = Object.values(state.results).reduce((n, v) => n + v, 0);
  const voted = state.mine !== null;

  function choose(i: number) {
    if (!open) return;
    const next = multiple ? (state.mine?.includes(i) ? (state.mine ?? []).filter((x) => x !== i) : [...(state.mine ?? []), i]) : [i];
    if (next.length === 0) return;
    const results = { ...state.results };
    for (const prev of state.mine ?? []) results[prev] = Math.max(0, (results[prev] ?? 0) - 1);
    for (const o of next) results[o] = (results[o] ?? 0) + 1;
    startTransition(async () => {
      setState({ results, mine: next });
      await onVote(next);
    });
  }

  return (
    <div>
      <ul className="space-y-1.5" aria-live="polite">
        {options.map((label, i) => {
          const n = state.results[i] ?? 0;
          const pct = total > 0 ? Math.round((n / total) * 100) : 0;
          const chosen = state.mine?.includes(i) ?? false;
          return (
            <li key={i}>
              <button
                type="button"
                aria-pressed={chosen}
                disabled={!open || pending}
                onClick={() => choose(i)}
                className={cn(
                  "relative w-full overflow-hidden rounded-md border px-3 py-2 text-left text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-default",
                  chosen ? "border-primary" : "border-rule hover:bg-muted",
                )}
              >
                {voted && <span aria-hidden className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />}
                <span className="relative flex items-center justify-between gap-3">
                  <span>{label}</span>
                  {voted && (
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {pct}% · {n}
                    </span>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        {total} vote{total === 1 ? "" : "s"}. {open ? (voted ? "You can change yours until it closes." : multiple ? "Pick as many as apply." : "One vote per verified student.") : "Closed."}
      </p>
    </div>
  );
}
