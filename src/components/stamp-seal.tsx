"use client";

import { useReducedMotion } from "motion/react";
import { PinMark } from "@/components/shell/wordmark";
import { Ripple } from "@/components/ui/ripple";
import { SpinningText } from "@/components/ui/spinning-text";
import { cn } from "@/lib/utils";

const promise = "verified students only · no ads · no resale · nothing for sale · ";

/**
 * The rubber-stamp seal: the house promises turning slowly around the pin, with a soft red ripple
 * under the pin to say the board is live. Fills the hero's right column; static under reduced motion.
 */
export function StampSeal({ className }: { className?: string }) {
  const reduced = useReducedMotion();
  return (
    <div className={cn("relative mx-auto flex size-[20rem] items-center justify-center text-primary sm:size-[24rem] lg:size-[27rem]", className)}>
      <SpinningText
        className="stamp absolute inset-0 flex -rotate-6 items-center justify-center font-mono text-[0.95rem] font-medium text-primary sm:text-[1.05rem]"
        radius={19}
        duration={60}
        variants={reduced ? { container: { visible: { rotate: 0 } } } : undefined}
      >
        {promise + promise}
      </SpinningText>
      {/* Inner ring */}
      <div className="absolute inset-[14%] rounded-full border-[3px] border-double border-primary/50" aria-hidden />
      {/* Live ripple + pin */}
      <div className="relative flex size-40 items-center justify-center" aria-hidden>
        <Ripple mainCircleSize={56} mainCircleOpacity={0.4} numCircles={4} color="oklch(0.72 0.15 25)" />
        <PinMark className="relative z-10 size-14 text-primary" />
      </div>
      <p className="stamp absolute inset-x-0 -bottom-1 flex items-center justify-center gap-2 text-foreground">
        <span className="relative inline-flex size-2">
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-[oklch(0.7_0.16_25)] opacity-75 motion-reduce:hidden" />
          <span className="relative inline-flex size-2 rounded-full bg-[oklch(0.62_0.18_27)]" />
        </span>
        Live at Illinois Tech
      </p>
    </div>
  );
}
