"use client";

import { MessageSquareTextIcon } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const sentiments = [
  { value: "love", emoji: "🤩", label: "Love it" },
  { value: "good", emoji: "🙂", label: "Good" },
  { value: "meh", emoji: "😕", label: "Confusing" },
  { value: "bad", emoji: "😞", label: "Frustrating" },
] as const;

type Sentiment = (typeof sentiments)[number]["value"];

/**
 * Vercel-style feedback popover (brief §9). Phase 1 ships the UI and local thank-you state;
 * Phase 5 wires the Server Action that stores it in `feedback` and forwards to GitHub/email.
 */
export function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState("");
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [includeContext, setIncludeContext] = useState(true);
  const textId = useId();
  const contextId = useId();

  function reset() {
    setSent(false);
    setMessage("");
    setSentiment(null);
  }

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) window.setTimeout(reset, 200);
      }}
    >
      <PopoverTrigger render={<Button variant="outline" size="sm" />}>
        <MessageSquareTextIcon className="size-4" aria-hidden />
        <span>Feedback</span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        {sent ? (
          <div className="space-y-2 text-center" role="status">
            <p className="font-heading text-xl">Thank you.</p>
            <p className="text-sm text-muted-foreground">Feedback is read by a human, usually within a week.</p>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
              Close
            </Button>
          </div>
        ) : (
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor={textId}>What is on your mind?</Label>
              <Textarea
                id={textId}
                required
                minLength={3}
                maxLength={2000}
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="A bug, an idea, or something that felt off."
              />
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
              <input
                id={contextId}
                type="checkbox"
                checked={includeContext}
                onChange={(e) => setIncludeContext(e.target.checked)}
                className="size-4 accent-primary"
              />
              <Label htmlFor={contextId} className="text-xs font-normal text-muted-foreground">
                Include this page&apos;s URL and browser version
              </Label>
            </div>
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={message.trim().length < 3}>
                Send
              </Button>
            </div>
          </form>
        )}
      </PopoverContent>
    </Popover>
  );
}
