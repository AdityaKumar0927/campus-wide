"use client";

import confetti from "canvas-confetti";
import { MessageSquareTextIcon } from "lucide-react";
import { usePathname } from "next/navigation";
import { useActionState, useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ComicText } from "@/components/ui/comic-text";
import { Textarea } from "@/components/ui/textarea";
import { bangers } from "@/lib/fonts/bangers";
import { cn } from "@/lib/utils";
import { submitFeedback, type FeedbackState } from "./feedback-actions";

const sentiments = [
  { value: "love", emoji: "🤩", label: "Love it" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "meh", emoji: "😕", label: "Confusing" },
  { value: "bad", emoji: "😞", label: "Frustrating" },
] as const;

type Sentiment = (typeof sentiments)[number]["value"];

/** Vercel-style feedback popover (brief §9): stored in `feedback`, forwarded to GitHub or email when configured. */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [includeContext, setIncludeContext] = useState(true);
  const [state, formAction, pending] = useActionState<FeedbackState, FormData>(submitFeedback, {});
  const celebratedRef = useRef<FeedbackState | null>(null);
  const pathname = usePathname();
  const textId = useId();
  const contextId = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const sent = Boolean(state.ok);

  /** Paper scraps in the board's stock colours; skipped automatically for reduced motion. */
  useEffect(() => {
    if (!state.ok || celebratedRef.current === state) return;
    celebratedRef.current = state;
    const rect = formRef.current?.getBoundingClientRect();
    confetti({
      particleCount: 36,
      spread: 55,
      startVelocity: 22,
      gravity: 1.1,
      ticks: 110,
      scalar: 0.9,
      shapes: ["square"],
      colors: ["#dce9f6", "#f6e9c2", "#fbf3b9", "#f8dfe3", "#d7efe2", "#2c6a4a"],
      origin: rect ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: rect.top / window.innerHeight } : undefined,
      disableForReducedMotion: true,
    });
  }, [state]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setMessage("");
          setSentiment(null);
        }
      }}
    >
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <MessageSquareTextIcon className="size-4" aria-hidden />
        <span>Feedback</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        {sent && open ? (
          <div className={`space-y-2 text-center ${bangers.variable}`} role="status">
            <ComicText fontSize={2.4} style={{ fontFamily: "var(--font-bangers), Impact, sans-serif" }} className="py-2">
              Thanks!
            </ComicText>
            <p className="text-sm text-muted-foreground">Feedback is read by a human, usually within a week.</p>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form ref={formRef} action={formAction} className="space-y-3">
            <input type="hidden" name="pageUrl" value={pathname ?? ""} />
            <input type="hidden" name="sentiment" value={sentiment ?? ""} />
            <div className="space-y-1.5">
              <Label htmlFor={textId}>What is on your mind?</Label>
              <Textarea id={textId} name="message" required minLength={3} maxLength={2000} rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="A bug, an idea, or something that felt off." />
            </div>
            <fieldset>
              <legend className="mb-1.5 text-sm font-medium">How did this page feel?</legend>
              <div className="flex gap-1" role="radiogroup">
                {sentiments.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    role="radio"
                    aria-checked={sentiment === s.value}
                    aria-label={s.label}
                    title={s.label}
                    onClick={() => setSentiment(s.value)}
                    className={cn(
                      "flex size-9 items-center justify-center rounded-md border text-lg outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
                      sentiment === s.value ? "border-primary bg-accent" : "border-rule hover:bg-muted",
                    )}
                  >
                    <span aria-hidden>{s.emoji}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            <div className="flex items-center gap-2">
              <input id={contextId} name="consent" type="checkbox" checked={includeContext} onChange={(e) => setIncludeContext(e.target.checked)} className="size-4 accent-primary" />
              <Label htmlFor={contextId} className="text-xs font-normal text-muted-foreground">
                Include this page&apos;s URL and browser version
              </Label>
            </div>
            {state.error && (
              <p role="alert" className="text-sm text-destructive">
                {state.error}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={pending || message.trim().length < 3 || !sentiment}>
                {pending ? "Sending…" : "Send"}
              </Button>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
