"use client";

import { useState } from "react";
import { PreviewNotice } from "./frame";
import { cn } from "@/lib/utils";

const options = [
  { id: "bog", label: "The Bog tots", votes: 38 },
  { id: "jerk", label: "Jerk chicken on 35th", votes: 27 },
  { id: "gg", label: "Global Grounds at midnight", votes: 19 },
];

export function PollPreview() {
  const [vote, setVote] = useState<string | null>(null);
  const total = options.reduce((n, o) => n + o.votes, 0) + (vote ? 1 : 0);
  return (
    <PreviewNotice stock="white" stamp={`Poll · ${total} votes · closes Friday`} title="Best late-night food near campus?" pinHue={155} rotate="-rotate-[0.3deg]">
      <ul className="space-y-1.5" aria-live="polite">
        {options.map((o) => {
          const n = o.votes + (vote === o.id ? 1 : 0);
          const pct = Math.round((n / total) * 100);
          return (
            <li key={o.id}>
              <button
                type="button"
                aria-pressed={vote === o.id}
                onClick={() => setVote(o.id)}
                className={cn(
                  "relative w-full overflow-hidden rounded-md border px-2.5 py-1.5 text-left text-[13px] outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  vote === o.id ? "border-primary" : "border-rule hover:bg-muted",
                )}
              >
                {vote && <span aria-hidden className="absolute inset-y-0 left-0 bg-accent transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${pct}%` }} />}
                <span className="relative flex items-center justify-between">
                  <span>{o.label}</span>
                  {vote && <span className="text-[11px] tabular-nums text-muted-foreground">{pct}%</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-auto text-xs text-muted-foreground">One vote per verified student. {vote ? "You can change it until it closes." : "Tap to vote."}</p>
    </PreviewNotice>
  );
}
