import Link from "next/link";
import { cn } from "@/lib/utils";

export function Wordmark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-baseline gap-1.5 rounded-sm font-heading text-xl leading-none tracking-tight text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        className,
      )}
      aria-label="Campus Wide home"
    >
      <span aria-hidden className="inline-block size-2.5 translate-y-[-1px] rounded-[2px] bg-primary" />
      <span>
        Campus <em className="text-primary">Wide</em>
      </span>
    </Link>
  );
}
