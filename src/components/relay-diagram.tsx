"use client";

import { useRef, type CSSProperties, type RefObject } from "react";
import { useReducedMotion } from "motion/react";
import { PinMark } from "@/components/shell/wordmark";
import { AnimatedBeam } from "@/components/ui/animated-beam";

/**
 * "Take a tab": how the masked relay works, drawn as twine strung between pinned notes on a cork
 * board. Messages travel along the string through the board; addresses never do.
 */

const twine = "#8b6f47";
const greenA = "#2c6a4a";
const greenB = "#8fd3b0";

function Note({
  ref,
  stock,
  stamp,
  title,
  foot,
  rotate,
}: {
  ref: RefObject<HTMLDivElement | null>;
  stock: "blue" | "manila";
  stamp: string;
  title: string;
  foot: string;
  rotate: string;
}) {
  return (
    <div
      ref={ref}
      className={`notice z-10 w-full max-w-[16rem] px-4 pt-5 pb-3 ${rotate}`}
      style={{ "--stock": `var(--stock-${stock})`, "--pin-hue": stock === "blue" ? 25 : 250 } as CSSProperties}
    >
      <p className="stamp">{stamp}</p>
      <p className="mt-2 text-[1.05rem] leading-snug">{title}</p>
      <p className="mt-3 text-xs text-muted-foreground">{foot}</p>
    </div>
  );
}

export function RelayDiagram() {
  const containerRef = useRef<HTMLDivElement>(null);
  const youRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const sellerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  // Reduced motion keeps the twine but drops the travelling pulse (one imperceptible pass, no repeat).
  const beam = {
    containerRef,
    pathColor: twine,
    pathOpacity: 0.55,
    pathWidth: 2,
    gradientStartColor: greenA,
    gradientStopColor: greenB,
    duration: reduced ? 0.01 : 4,
    repeat: reduced ? 0 : Infinity,
  };

  return (
    <div ref={containerRef} className="board relative overflow-hidden rounded-2xl border border-rule p-6 md:p-10">
      <div className="relative z-10 grid grid-cols-1 items-center justify-items-center gap-10 md:grid-cols-[1fr_auto_1fr] md:gap-8">
        <Note
          ref={youRef}
          stock="blue"
          stamp="You · took a tab"
          title="Is the bike still available? I can do Thursday."
          foot="Sent through the board. No address attached."
          rotate="-rotate-[1.2deg]"
        />
        <div ref={boardRef} className="flex size-20 items-center justify-center rounded-full border border-rule bg-card shadow-sm" aria-hidden>
          <PinMark className="size-8 rotate-0" />
        </div>
        <Note
          ref={sellerRef}
          stock="manila"
          stamp="The seller · replied"
          title="Yes. Library front desk at four?"
          foot="Replied from the board. Still no address."
          rotate="rotate-[1deg]"
        />
      </div>
      <AnimatedBeam {...beam} fromRef={youRef} toRef={boardRef} curvature={-40} />
      <AnimatedBeam {...beam} fromRef={boardRef} toRef={sellerRef} curvature={-40} delay={reduced ? 0 : 2} />
      <AnimatedBeam {...beam} fromRef={sellerRef} toRef={boardRef} curvature={40} reverse delay={reduced ? 0 : 4} />
      <AnimatedBeam {...beam} fromRef={boardRef} toRef={youRef} curvature={40} reverse delay={reduced ? 0 : 6} />
    </div>
  );
}
