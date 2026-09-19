import type { ReactNode } from "react";
import Link from "next/link";
import { getCampus } from "@/lib/dal/campus";
import { unreadCount } from "@/lib/dal/notifications";
import type { Session } from "@/lib/dal/session";
import { BottomNav } from "./bottom-nav";
import { FeedbackButton } from "./feedback-button";
import { InstallPrompt } from "./install-prompt";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { SidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "./theme-toggle";
import { Wordmark } from "./wordmark";

/**
 * Authenticated-area chrome: desktop sidebar + top bar, mobile top bar + bottom nav.
 * Server component; interactive pieces are small client islands.
 */
export async function AppShell({ children, session }: { children: ReactNode; session?: Session | null }) {
  const [unread, campus] = session ? await Promise.all([unreadCount(), getCampus()]) : [0, null];
  const readOnly = session?.membership?.status && session.membership.status !== "active";
  return (
    // The campus accent hue (D-18: one per-tenant knob) tints every token derived from --accent-hue.
    <div className="flex min-h-dvh flex-col md:flex-row" style={campus ? ({ "--accent-hue": campus.accentHue } as React.CSSProperties) : undefined}>
      <aside className="hidden w-60 shrink-0 border-r border-rule bg-sidebar md:flex md:flex-col">
        <div className="flex h-14 items-center border-b border-rule px-4">
          <Wordmark href="/feed" />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <SidebarNav unread={unread} flags={campus?.featureFlags} role={session?.membership?.campusRole} />
        </div>
        <div className="stamp border-t border-rule px-4 py-3">
          Press <kbd className="rounded border border-rule bg-muted px-1">?</kbd> for shortcuts
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-2 border-b border-rule bg-background/90 px-4 pt-safe-top backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="md:hidden">
            <Wordmark href="/feed" />
          </div>
          <p className="stamp hidden md:block">{campus?.shortName ?? "Illinois Tech"}, Mies Campus{readOnly ? ". Read-only until you re-verify" : ""}</p>
          <div className="flex items-center gap-1">
            <FeedbackButton />
            <ThemeToggle />
            {session?.profile ? (
              <Link href="/settings" aria-label="Your account" className="ml-1 flex size-8 items-center justify-center rounded-full border border-rule bg-[var(--stock-blue)] text-xs font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
                {session.profile.initials}
              </Link>
            ) : null}
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 px-4 pt-6 pb-24 outline-none md:px-8 md:pb-10">
          <div className="mx-auto w-full max-w-3xl">
            <InstallPrompt />
            {readOnly && (
              <p role="status" className="notice mb-6 px-4 py-3 text-sm" style={{ "--stock": "var(--stock-yellow)" } as React.CSSProperties}>
                {session?.membership?.status === "suspended" ? (
                  <>
                    Your account is suspended: you can read but not post or message.{" "}
                    <Link href="/suspended" className="underline underline-offset-4">
                      Read the reasons and appeal
                    </Link>
                    .
                  </>
                ) : (
                  "Your account is read-only until you re-verify your campus email for this term. Sign out and back in to do that."
                )}
              </p>
            )}
            {children}
          </div>
        </main>
      </div>

      <BottomNav unread={unread} />
      <KeyboardShortcuts />
    </div>
  );
}
