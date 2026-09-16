import type { ReactNode } from "react";
import { BottomNav } from "./bottom-nav";
import { FeedbackButton } from "./feedback-button";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

/**
 * Authenticated-area chrome: desktop sidebar + top bar, mobile top bar + bottom nav.
 * Server component; interactive pieces are small client islands.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="hidden w-60 shrink-0 border-r border-rule bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-rule px-4">
          <Wordmark href="/feed" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <SidebarNav />
        </div>
        <div className="border-t border-rule px-4 py-3 text-xs text-muted-foreground">
          Press <kbd className="rounded border border-rule bg-muted px-1 font-mono">?</kbd> for shortcuts
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-rule bg-background/90 px-4 pt-safe-top backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="md:hidden">
            <Wordmark href="/feed" />
          </div>
          <p className="hidden text-sm text-muted-foreground md:block">Demo campus · preview build</p>
          <div className="flex items-center gap-1">
            <FeedbackButton />
            <ThemeToggle />
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 px-4 pt-6 pb-24 outline-none md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-3xl">{children}</div>
        </main>
      </div>

      <BottomNav />
      <KeyboardShortcuts />
    </div>
  );
}
