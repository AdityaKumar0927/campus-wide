import Link from "next/link";
import type { AuthorSummary } from "@/lib/dal/posts";
import { cn } from "@/lib/utils";

/** How people appear on the board: initials on a paper disc, display name, @UID. Never a photo. */
export function AuthorChip({ author, className, when }: { author: AuthorSummary | null; className?: string; when?: string }) {
  if (!author) {
    return <span className={cn("inline-flex items-center gap-2 text-xs text-muted-foreground", className)}>Former member{when ? ` · ${when}` : ""}</span>;
  }
  return (
    <span className={cn("inline-flex items-center gap-2 text-xs", className)}>
      <span aria-hidden className="flex size-6 shrink-0 items-center justify-center rounded-full border border-rule bg-[var(--card)] text-[10px] font-medium">
        {author.initials}
      </span>
      <Link href={`/u/${author.campus_username}`} className="font-medium text-foreground underline-offset-4 hover:underline">
        {author.display_name}
      </Link>
      <span className="font-mono text-[11px] text-muted-foreground">@{author.campus_username}</span>
      {when && <span className="text-muted-foreground">· {when}</span>}
    </span>
  );
}
