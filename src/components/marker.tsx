"use client";

import { useReducedMotion } from "motion/react";
import { Highlighter } from "@/components/ui/highlighter";

type Action = "highlight" | "underline" | "circle" | "box";

/** A marker pen on paper: hand-drawn highlight or underline that draws itself when scrolled into view. */
export function Marker({ children, action = "highlight", color }: { children: React.ReactNode; action?: Action; color?: string }) {
  const reduced = useReducedMotion();
  const ink = color ?? (action === "highlight" ? "oklch(0.92 0.16 100 / 70%)" : "oklch(0.55 0.13 155)");
  return (
    <Highlighter action={action} color={ink} strokeWidth={action === "highlight" ? 1 : 2} padding={action === "highlight" ? 1 : 3} animationDuration={reduced ? 0 : 700} iterations={2} isView>
      {children}
    </Highlighter>
  );
}
