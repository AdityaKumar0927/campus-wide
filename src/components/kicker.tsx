import type { ReactNode } from "react";
import { WashiTape } from "@/components/washi-tape";
import { cn } from "@/lib/utils";

/** The little tear-off tab that marks a section: a torn edge on top, a solid tab below. */
function TabGlyph() {
  return (
    <svg viewBox="0 0 18 12" aria-hidden className="h-3 w-[18px] shrink-0 text-primary">
      <path d="M1.5 1.5h15" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeDasharray="1.6 1.9" />
      <path d="M1.5 1.5v7.4a1.6 1.6 0 0 0 1.6 1.6h11.8a1.6 1.6 0 0 0 1.6-1.6V1.5" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

/** Section kicker: plain sentence-case text behind a tab glyph. Never uppercase, never mono. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn("stamp flex items-center gap-2", className)}>
      <TabGlyph />
      <span>{children}</span>
    </p>
  );
}

/** A short label taped to the page, for the one line above a headline that deserves some paper. */
export function TapeLabel({ children, hue = 100, className }: { children: ReactNode; hue?: number; className?: string }) {
  return (
    <span className={cn("relative inline-flex -rotate-[1.2deg] items-center px-4 py-1.5 text-[0.8125rem] font-medium text-[oklch(0.25_0.02_60)]", className)}>
      <WashiTape hue={hue} preserveAspectRatio="none" className="absolute inset-0 size-full" />
      <span className="relative">{children}</span>
    </span>
  );
}
