import Link from "next/link";
import { cn } from "@/lib/utils";

/** The pin: Campus Wide's mark. Decorative; the link text carries the name. */
export function PinMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 18" aria-hidden className={cn("size-4 -rotate-[18deg] text-primary", className)}>
      <circle cx="8" cy="6" r="5" fill="currentColor" />
      <circle cx="6.3" cy="4.4" r="1.4" fill="oklch(1 0 0 / 55%)" />
      <path d="M8 11v6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export function Wordmark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm font-heading text-[1.35rem] leading-none tracking-tight text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label="Campus Wide home"
    >
      <PinMark />
      <span>
        Campus <em className="text-primary">Wide</em>
      </span>
    </Link>
  );
}
