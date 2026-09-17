import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { getSession } from "@/lib/dal/session";
import { FeedbackButton } from "./feedback-button";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

const links = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#universities", label: "For universities" },
  { href: "/#safety", label: "Safety" },
];

export async function SiteHeader() {
  const session = await getSession();
  return (
    <header className="sticky top-0 z-40 border-b border-rule bg-background/90 pt-safe-top backdrop-blur supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Wordmark />
        <nav aria-label="Site" className="hidden items-center gap-6 text-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="inline-flex min-h-6 items-center rounded-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-1.5">
          <FeedbackButton />
          <ThemeToggle />
          <Link href={session ? "/feed" : "/sign-in"} className={buttonVariants({ size: "sm" })}>
            {session ? "Open the board" : "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
}
