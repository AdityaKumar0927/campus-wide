"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const goto: Record<string, string> = { f: "/feed", q: "/questions", i: "/inbox", e: "/events", m: "/market" };

const shortcuts = [
  { keys: ["?"], does: "Show this list" },
  { keys: ["g", "f"], does: "Go to feed" },
  { keys: ["g", "q"], does: "Go to questions" },
  { keys: ["g", "i"], does: "Go to inbox" },
  { keys: ["g", "e"], does: "Go to events" },
  { keys: ["g", "m"], does: "Go to marketplace" },
  { keys: ["n"], does: "New post" },
  { keys: ["Esc"], does: "Close dialogs" },
];

function isTyping(target: EventTarget | null) {
  const el = target as HTMLElement | null;
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

/** Desktop keyboard shortcuts (`?` opens the reference). Sequences like `g f` time out after 800 ms. */
export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pending = useRef<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (pending.current === "g") {
        pending.current = null;
        window.clearTimeout(timer.current);
        const href = goto[e.key];
        if (href) router.push(href);
        return;
      }
      if (e.key === "g") {
        pending.current = "g";
        timer.current = window.setTimeout(() => (pending.current = null), 800);
      } else if (e.key === "n") {
        router.push("/post");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [router]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Keyboard shortcuts</DialogTitle>
          <DialogDescription>Work faster on a keyboard. Sequences are typed one key after another.</DialogDescription>
        </DialogHeader>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          {shortcuts.map((s) => (
            <div key={s.does} className="contents">
              <dt className="flex gap-1">
                {s.keys.map((k) => (
                  <kbd key={k} className="rounded border border-rule bg-muted px-1.5 py-0.5 font-mono text-xs">
                    {k}
                  </kbd>
                ))}
              </dt>
              <dd className="text-muted-foreground">{s.does}</dd>
            </div>
          ))}
        </dl>
      </DialogContent>
    </Dialog>
  );
}
