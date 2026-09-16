import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** Editorial empty state: a dashed hairline plate with a serif headline. Never a sad face. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <section
      aria-live="polite"
      className={cn(
        "flex flex-col items-center rounded-xl border border-dashed border-rule bg-card/60 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <h2 className="text-2xl">{title}</h2>
      {description && <p className="mt-2 max-w-prose text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </section>
  );
}
