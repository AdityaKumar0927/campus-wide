"use client";

import { useOptimistic, useTransition } from "react";
import { ThanksIcon } from "@/components/icons/board-icons";
import { cn } from "@/lib/utils";

/** Thank-you toggle. Optimistic, keyboard-friendly, and honest about its state (aria-pressed). */
export function ThanksButton({
  count,
  pressed,
  label,
  onToggle,
}: {
  count: number;
  pressed: boolean;
  label: string;
  onToggle: () => Promise<boolean>;
}) {
  const [state, setState] = useOptimistic({ count, pressed });
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      aria-pressed={state.pressed}
      aria-label={label}
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setState({ pressed: !state.pressed, count: state.count + (state.pressed ? -1 : 1) });
          await onToggle();
        })
      }
      className={cn(
        "inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-progress",
        state.pressed ? "border-primary bg-primary text-primary-foreground" : "border-rule bg-card text-foreground hover:bg-muted",
      )}
    >
      <ThanksIcon className="size-3.5" /> Thank you · {state.count}
    </button>
  );
}
