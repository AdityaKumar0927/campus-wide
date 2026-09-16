import type { Metadata } from "next";
import { NewspaperIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between border-b border-rule pb-4">
        <div>
          <p className="font-heading text-sm italic text-muted-foreground">Demo campus</p>
          <h1 className="text-4xl">Feed</h1>
        </div>
        <p className="text-xs text-muted-foreground">Newest first · no infinite scroll</p>
      </header>
      <EmptyState
        icon={NewspaperIcon}
        title="Nothing posted yet."
        description="Sign-in with a university email arrives in Phase 2, and posts, questions, and answers in Phase 3. This preview shows the shell, theme, and navigation."
        action={
          <Link href="/" className={buttonVariants({ variant: "outline" })}>
            Read how it works
          </Link>
        }
      />
    </div>
  );
}
