import type { SVGProps } from "react";
import { cn } from "@/lib/utils";

/**
 * Spot illustrations in the same hand as the icon set: line drawings on a 160 x 110 grid with paper
 * fills taken from the stock tokens, so they follow the theme. All decorative.
 */
function Frame({ className, children, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 160 110"
      aria-hidden
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("h-auto w-40 text-foreground", className)}
      {...props}
    >
      {children}
    </svg>
  );
}

const paper = (stock: string) => ({ fill: `var(--stock-${stock})` });
const pinFill = { fill: "oklch(0.62 0.16 var(--pin-hue, 25))" };

/** An empty board: cork, one index card, one pin, and room for everything else. */
export function EmptyBoardIllustration(p: SVGProps<SVGSVGElement>) {
  return (
    <Frame {...p}>
      <rect x="10" y="12" width="140" height="86" rx="6" style={paper("manila")} strokeOpacity={0.45} />
      {Array.from({ length: 5 }, (_, r) =>
        Array.from({ length: 8 }, (_, c) => <circle key={`${r}-${c}`} cx={24 + c * 16} cy={26 + r * 15} r="0.9" fill="currentColor" stroke="none" opacity={0.25} />),
      )}
      <g transform="rotate(-4 80 56)">
        <rect x="52" y="36" width="56" height="40" rx="2" style={paper("white")} />
        <path d="M60 50h30M60 58h40M60 66h22" strokeOpacity={0.35} />
        <circle cx="80" cy="35" r="4" style={pinFill} stroke="none" />
        <circle cx="78.6" cy="33.6" r="1.2" fill="white" fillOpacity={0.6} stroke="none" />
      </g>
    </Frame>
  );
}

/** Not found: the pin is still there, but only a torn corner of the notice stayed under it. */
export function TornNoticeIllustration(p: SVGProps<SVGSVGElement>) {
  return (
    <Frame {...p}>
      <path d="M40 30h80v0" strokeOpacity={0} />
      <path d="M58 24h44l-4 9 5 8-7 6 3 9-8 4-2 9-6-6-8 5-3-8-9-2 4-8-6-6 6-7-3-8z" style={paper("white")} />
      <path d="M66 36h24M66 44h18" strokeOpacity={0.35} />
      <circle cx="80" cy="23" r="5" style={pinFill} stroke="none" />
      <circle cx="78.3" cy="21.3" r="1.5" fill="white" fillOpacity={0.6} stroke="none" />
      <path d="M118 78c6-3 9-8 10-14M124 90c8-2 12-6 14-11M28 84c5 1 9 0 12-3" strokeOpacity={0.5} strokeDasharray="2 3" />
    </Frame>
  );
}

/** Offline: a notice slipped its tab and is drifting away from the pin on a loose thread. */
export function OutOfReachIllustration(p: SVGProps<SVGSVGElement>) {
  return (
    <Frame {...p}>
      <circle cx="26" cy="86" r="5" style={pinFill} stroke="none" />
      <circle cx="24.3" cy="84.3" r="1.5" fill="white" fillOpacity={0.6} stroke="none" />
      <path d="M26 92v8" />
      <path d="M31 84c20-6 30-28 52-40" strokeDasharray="3 4" strokeOpacity={0.6} />
      <g transform="rotate(14 106 40)">
        <rect x="84" y="20" width="46" height="36" rx="2" style={paper("blue")} />
        <path d="M92 32h24M92 40h30M92 48h18" strokeOpacity={0.35} />
      </g>
      <path d="M136 70c6 1 10 4 12 8M132 82c8-1 14 2 18 7M22 62c-6 2-10 6-12 10" strokeOpacity={0.5} />
    </Frame>
  );
}

/** Coming soon: two cards, the front one taped and still blank, a pencil waiting. */
export function ComingSoonIllustration(p: SVGProps<SVGSVGElement>) {
  return (
    <Frame {...p}>
      <g transform="rotate(5 92 62)">
        <rect x="64" y="40" width="56" height="42" rx="2" style={paper("yellow")} />
      </g>
      <g transform="rotate(-3 72 54)">
        <rect x="44" y="32" width="56" height="44" rx="2" style={paper("white")} />
        <path d="M52 48h22M52 56h32M52 64h16" strokeOpacity={0.3} strokeDasharray="2 3" />
        <path d="M60 28l3 2-2 3 3 2-2 3 2 2h26l-3-2 2-3-3-2 2-3-2-2z" style={{ fill: "oklch(0.9 0.08 100 / 0.85)" }} stroke="oklch(0 0 0 / 0.1)" strokeWidth={0.5} />
      </g>
      <g transform="rotate(-38 118 84)">
        <rect x="104" y="80" width="30" height="7" rx="1" style={paper("manila")} />
        <path d="M134 80l6 3.5-6 3.5z" style={paper("white")} />
        <path d="M104 80v7" />
      </g>
    </Frame>
  );
}
