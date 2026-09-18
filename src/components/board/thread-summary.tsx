"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { promptApiAvailable } from "@/lib/ai/capabilities";

type LanguageModelLike = { create: (opts?: { initialPrompts?: { role: string; content: string }[] }) => Promise<{ prompt: (p: string) => Promise<string>; destroy?: () => void }> };

/**
 * Summaries and translations: first the browser (Chrome Prompt API, nothing leaves the device),
 * then the campus server fallback if the admin switched it on. Hidden when neither exists.
 */
export function ThreadSummary({
  text,
  serverAi,
  onSummarize,
  onTranslate,
}: {
  text: string;
  serverAi: boolean;
  onSummarize: () => Promise<string | null>;
  onTranslate: (language: string) => Promise<string | null>;
}) {
  const [local, setLocal] = useState(false);
  const [result, setResult] = useState<{ kind: string; text: string } | null>(null);
  const [pending, start] = useTransition();
  useEffect(() => {
    let alive = true;
    promptApiAvailable().then((ok) => alive && setLocal(ok));
    return () => {
      alive = false;
    };
  }, []);
  if (!local && !serverAi) return null;

  async function summarizeLocally(): Promise<string | null> {
    try {
      const lm = (self as unknown as { LanguageModel: LanguageModelLike }).LanguageModel;
      const session = await lm.create({ initialPrompts: [{ role: "system", content: "Summarise the thread in at most four short sentences. Do not invent anything." }] });
      const out = await session.prompt(text.slice(0, 12_000));
      session.destroy?.();
      return out;
    } catch {
      return null;
    }
  }

  return (
    <section aria-label="AI help" className="rounded-md border border-dashed border-rule p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => start(async () => setResult({ kind: "Summary", text: (local ? await summarizeLocally() : null) ?? (serverAi ? await onSummarize() : null) ?? "Not available right now." }))}>
          {pending ? "Working…" : "Summarise this thread"}
        </Button>
        {serverAi && (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => start(async () => setResult({ kind: "Translation", text: (await onTranslate("English")) ?? "Not available right now." }))}>
            Translate to English
          </Button>
        )}
        <span className="text-xs text-muted-foreground">{local ? "Runs in your browser." : "Sent to the campus AI provider with emails, phones, and handles removed."}</span>
      </div>
      {result && (
        <div className="mt-2">
          <p className="stamp">{result.kind} · AI-generated, may be wrong</p>
          <p className="mt-1 whitespace-pre-wrap">{result.text}</p>
        </div>
      )}
    </section>
  );
}
