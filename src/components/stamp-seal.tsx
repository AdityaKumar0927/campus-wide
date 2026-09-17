"use client";

import { useReducedMotion } from "motion/react";
import { PinMark } from "@/components/shell/wordmark";
import { SpinningText } from "@/components/ui/spinning-text";
import { cn } from "@/lib/utils";

/** A rubber-stamp seal: the house promises circling the pin, turning slowly like a stamp being set. */
export function StampSeal({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={cn("relative size-40 -rotate-12 text-primary", className)}>
      <SpinningText
        className="stamp absolute inset-0 flex items-center justify-center font-mono text-[10px] font-medium text-primary"
        radius={7.2}
        duration={45}
        variants={reduced ? { container: { visible: { rotate: 0 } } } : undefined}
      >
        {"verified · university email only · no ads · no resale · "}
      </SpinningText>
      <div className="absolute inset-0 m-auto flex size-[4.5rem] items-center justify-center rounded-full border-[3px] border-double border-primary/70">
        <PinMark className="size-7" />
      </div>
    </div>
  );
}
