"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { extractEventFromText } from "./ai-actions";

/** Paste an announcement; the fields fill themselves (server AI, opt-in per campus, PII scrubbed). */
export function EventFromText() {
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);
  const [pending, start] = useTransition();
  function setField(id: string, value: string | undefined) {
    const el = document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement | null;
    if (!el || value === undefined) return;
    const setter = Object.getOwnPropertyDescriptor(el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, "value")?.set;
    setter?.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return (
    <div className="sm:col-span-2 rounded-md border border-dashed border-rule p-3">
      <label htmlFor="event-paste" className="block text-sm font-medium">
        Paste an announcement and let the fields fill themselves (optional)
      </label>
      <textarea id="event-paste" value={text} onChange={(e) => setText(e.target.value)} rows={3} maxLength={4000} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="Jazz night, Friday Oct 2 at 8pm in The Bog, free..." />
      <div className="mt-2 flex items-center gap-3">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending || text.trim().length < 10}
          onClick={() =>
            start(async () => {
              const ev = await extractEventFromText(text);
              if (!ev) {
                setNote("Could not read an event from that. Fill the fields by hand.");
                return;
              }
              setField("title", ev.title);
              setField("startsAt", ev.startsAt);
              setField("endsAt", ev.endsAt);
              setField("location", ev.location);
              setField("body", ev.description);
              setNote("Filled in. Check every field before you pin it.");
            })
          }
        >
          {pending ? "Reading…" : "Fill the fields"}
        </Button>
        <span className="text-xs text-muted-foreground">{note ?? "Sent to the campus AI provider with emails, phones, and handles removed."}</span>
      </div>
    </div>
  );
}
