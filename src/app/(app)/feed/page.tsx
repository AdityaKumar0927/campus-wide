import type { Metadata } from "next";
import { PinIcon } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Feed" };

export default function FeedPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between border-b border-rule pb-4">
        <div>
          <p className="stamp">Demo campus · the board</p>
          <h1 className="mt-1 text-5xl">Feed</h1>
        </div>
        <p className="stamp hidden sm:block">Newest first · no infinite scroll</p>
      </header>
      <EmptyState
        icon={PinIcon}
        stock="blue"
        stamp="Nothing on the board yet"
        title="Quiet today. That is allowed."
        description="Sign-in with a university email arrives in Phase 2; pinning questions, notices, and answers in Phase 3. This preview shows the board, the paper, and the navigation."
        action={
          <Link href="/" className={buttonVariants({ variant: "outline", size: "sm" })}>
            See how the board works
          </Link>
        }
      />
    </div>
  );
}
