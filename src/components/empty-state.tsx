import type { CSSProperties, ReactNode } from "react";
import type { IconComponent } from "@/components/icons/board-icons";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: IconComponent;
  /** A spot illustration from illustrations.tsx; takes the place of the icon when given. */
  illustration?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** Paper stock for the notice; defaults to a white index card. */
  stock?: "white" | "manila" | "blue" | "pink" | "yellow" | "green";
  stamp?: string;
  className?: string;
}

/** An empty board is not sad: it is one pinned index card telling you what to do next. */
export function EmptyState({ icon: Icon, illustration, title, description, action, stock = "white", stamp = "Nothing pinned yet", className }: EmptyStateProps) {
  return (
    <section aria-live="polite" className={cn("board rounded-2xl border border-rule px-4 py-10 md:px-8", className)}>
      <div
        className="notice mx-auto max-w-md -rotate-[0.8deg] px-6 pt-6 pb-5 text-center"
        style={{ "--stock": `var(--stock-${stock})` } as CSSProperties}
      >
        <p className="stamp">{stamp}</p>
        {illustration ? (
          <div className="mx-auto mt-4 flex justify-center">{illustration}</div>
        ) : Icon ? (
          <span className="mx-auto mt-4 flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Icon className="size-5" />
          </span>
        ) : null}
        <h2 className="mt-3 text-3xl">{title}</h2>
        {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
        {action && <div className="mt-5">{action}</div>}
      </div>
    </section>
  );
}
