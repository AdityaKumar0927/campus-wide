import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PinMark } from "@/components/shell/wordmark";
import { getSession } from "@/lib/dal/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { SignInForm } from "./sign-in-form";

export const metadata: Metadata = { title: "Sign in" };

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next = "/feed", error } = await searchParams;
  const session = await getSession();
  if (session) redirect(session.namePending ? "/onboarding" : next);

  return (
    <div className="board min-h-dvh px-4 py-12">
      <div className="notice mx-auto max-w-md -rotate-[0.6deg] px-6 pt-8 pb-6" style={{ "--stock": "var(--stock-white)" } as React.CSSProperties}>
        <p className="stamp">For Illinois Tech students, faculty, and staff</p>
        <h1 className="mt-2 text-4xl">Prove it is you. That is all we ask.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          We email a code to your campus address. We never see your Illinois Tech password, never connect to Okta or Microsoft 365, and never ask for a photo or ID.
        </p>
        <div className="mt-6">
          {isSupabaseConfigured() ? (
            <SignInForm next={next} initialError={error === "link" ? "That link has expired or was already used. Request a new code." : undefined} />
          ) : (
            <p role="status" className="rounded-md border border-rule bg-[var(--stock-yellow)] px-3 py-2 text-sm">
              Sign-in is not connected on this deployment yet. The database and email service are configured in Phase 2; until then this preview shows the public pages only.
            </p>
          )}
        </div>
        <p className="mt-6 flex items-center gap-1.5 text-xs text-muted-foreground">
          <PinMark className="size-3" /> Student-run. Not affiliated with or endorsed by Illinois Institute of Technology.{" "}
          <Link href="/#safety" className="underline-offset-4 hover:underline">House rules</Link>
        </p>
      </div>
    </div>
  );
}
