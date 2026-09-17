import type { CSSProperties, ReactNode } from "react";
import { WashiTape } from "@/components/washi-tape";
import { cn } from "@/lib/utils";

export type Stock = "white" | "manila" | "blue" | "pink" | "yellow" | "green";

/** A preview is a real notice: paper stock, a stamp line, and live controls inside. */
export function PreviewNotice({
  stock,
  stamp,
  title,
  children,
  className,
  pinHue = 25,
  rotate = "",
  held,
}: {
  stock: Stock;
  stamp: string;
  title: string;
  children: ReactNode;
  className?: string;
  pinHue?: number;
  rotate?: string;
  /** Tape instead of a pin. */
  held?: "tape";
}) {
  return (
    <li className={cn("reveal", className)}>
      <section
        className={cn("notice flex h-full flex-col px-4 pt-5 pb-4", rotate)}
        style={{ "--stock": `var(--stock-${stock})`, "--pin-hue": pinHue } as CSSProperties}
        aria-label={`${title} preview`}
        data-held={held}
      >
        {held === "tape" && <WashiTape hue={pinHue === 155 ? 150 : 100} className="absolute -top-2.5 left-1/2 h-5 w-28 -translate-x-1/2 -rotate-3" />}
        <p className="stamp">{stamp}</p>
        <h3 className="mt-2 text-lg leading-snug">{title}</h3>
        <div className="mt-3 flex flex-1 flex-col gap-3 text-sm">{children}</div>
      </section>
    </li>
  );
}

/** Initials on a paper disc; how people appear everywhere on the board. */
export function Person({ initials, name, uid, className }: { initials: string; name: string; uid: string; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <span aria-hidden className="flex size-6 items-center justify-center rounded-full border border-rule bg-[var(--card)] text-[10px] font-medium">
        {initials}
      </span>
      <span className="text-foreground">{name}</span>
      <span className="font-mono text-[11px] text-muted-foreground">@{uid}</span>
    </span>
  );
}

/** Tiny pill button used inside previews. */
export function Chip({
  active,
  children,
  onClick,
  ariaLabel,
  pressed,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  ariaLabel?: string;
  pressed?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={pressed}
      className={cn(
        "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-xs font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
        active ? "border-primary bg-primary text-primary-foreground" : "border-rule bg-[var(--card)] text-foreground hover:bg-muted",
      )}
    >
      {children}
    </button>
  );
}
