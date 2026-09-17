import { useId, type CSSProperties, type SVGProps } from "react";

/**
 * A strip of washi tape: the other way a notice is held to the board. Torn ends, faint diagonal
 * stripes, translucent enough for the paper to show through. Pass a hue to recolour the roll.
 */
export function WashiTape({
  className,
  hue = 100,
  style,
  ...props
}: SVGProps<SVGSVGElement> & { hue?: number }) {
  const id = useId();
  return (
    <svg
      viewBox="0 0 120 22"
      aria-hidden
      className={className ?? "h-5 w-28"}
      style={{ "--tape-hue": hue, filter: "drop-shadow(0 1px 1px oklch(0 0 0 / 0.12))", ...style } as CSSProperties}
      {...props}
    >
      <defs>
        <pattern id={id} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="6" height="6" style={{ fill: "oklch(0.93 0.06 var(--tape-hue) / 0.88)" }} />
          <rect width="2.2" height="6" style={{ fill: "oklch(0.87 0.09 var(--tape-hue) / 0.9)" }} />
        </pattern>
      </defs>
      <path
        d="M2 3l3 2-2 3 3 2-2 3 3 2-2 3 2 2H116l-3-2 2-3-3-2 2-3-3-2 2-3-2-2z"
        fill={`url(#${id})`}
        stroke="oklch(0 0 0 / 0.08)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
