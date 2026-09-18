"use client";

import { useEffect, useRef, useState } from "react";
import { toxicity } from "@/lib/ai/client";

/** A gentle, on-device nudge before posting something harsh. Never blocks, never leaves the browser. */
export function ToxicityNudge({ text }: { text: string }) {
  const [verdict, setVerdict] = useState<{ score: number; label: string } | null>(null);
  const latest = useRef(0);
  useEffect(() => {
    const t = text.trim();
    if (t.length < 20) return;
    const run = ++latest.current;
    const timer = setTimeout(async () => {
      const v = await toxicity(t);
      if (run === latest.current) setVerdict(v && v.score >= 0.7 ? v : null);
    }, 900);
    return () => clearTimeout(timer);
  }, [text]);
  if (!verdict || text.trim().length < 20) return null;
  return (
    <p role="status" className="rounded-md border border-rule bg-[var(--stock-pink)] px-3 py-2 text-sm">
      This reads {verdict.label.replace("_", " ")}. Everyone here is a real person on your campus; want to soften it before you pin it? You can still post as it is.
    </p>
  );
}
