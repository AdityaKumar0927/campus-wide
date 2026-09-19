import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { AuthError, requireMember } from "@/lib/dal/session";
import { createClient } from "@/lib/supabase/server";
import { unblockUser, unmuteUser } from "@/app/(app)/u/[username]/actions";
import { listBlocked, listMuted } from "@/lib/dal/admin";
import { BrowserAiToggle } from "@/components/shell/browser-ai-toggle";
import { PushToggle } from "@/components/shell/push-toggle";
import { getDeletionRequest } from "@/lib/dal/compliance";
import { cancelDeletion } from "./danger-actions";
import { DeleteAccount } from "./delete-account";
import { revokeSession, setPrivacyMode } from "./actions";

export const metadata: Metadata = { title: "Settings" };

interface SessionRow { id: string; created_at: string; refreshed_at: string | null; user_agent: string | null; ip: string | null; is_current: boolean }

function describe(ua: string | null) {
  if (!ua) return "Unknown device";
  const os = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : /Firefox\//.test(ua) ? "Firefox" : "browser";
  return `${browser} on ${os}`;
}

export default async function SettingsPage() {
  let session;
  try {
    session = await requireMember();
  } catch (e) {
    redirect(e instanceof AuthError && e.code === "onboarding_required" ? "/onboarding" : "/sign-in?next=/settings");
  }
  const supabase = await createClient();
  const { data: sessions } = await supabase.rpc("list_my_sessions");
  const rows = (sessions ?? []) as SessionRow[];
  const [blocked, muted, deletion] = await Promise.all([listBlocked(), listMuted(), getDeletionRequest()]);

  return (
    <div className="space-y-10">
      <header className="border-b border-rule pb-4">
        <p className="stamp">{session.profile?.displayName} <span className="font-mono">@{session.profile?.campusUsername}</span></p>
        <h1 className="mt-1 text-5xl">Your account</h1>
      </header>

      <section className="space-y-3">
        <h2 className="text-2xl">Identity</h2>
        <p className="text-sm text-muted-foreground">
          Signed in as <span className="font-mono">{session.email}</span>. Your handle and name are locked; ask a moderator in person to correct the name.
        </p>
        <form action={setPrivacyMode} className="flex items-start gap-3 rounded-md border border-rule bg-card p-3">
          <input id="privacy" type="checkbox" name="privacy_mode" defaultChecked={session.profile?.privacyMode} className="mt-1 size-4 accent-primary" />
          <label htmlFor="privacy" className="text-sm">
            <span className="font-medium">Privacy mode.</span> Show only my initials, hide my profile from browsing, and reveal my name only inside threads I take part in. Use this if someone is bothering you; no questions asked.
          </label>
          <Button type="submit" size="sm" variant="outline" className="ml-auto shrink-0">Save</Button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Where you are signed in</h2>
        <ul className="divide-y divide-rule rounded-md border border-rule bg-card">
          {rows.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <div>
                <p className="font-medium">{describe(s.user_agent)} {s.is_current && <span className="stamp ml-1">this device</span>}</p>
                <p className="text-xs text-muted-foreground">Signed in {new Date(s.created_at).toLocaleString("en-US", { timeZone: "America/Chicago" })}{s.ip ? ` · ${s.ip}` : ""}</p>
              </div>
              {!s.is_current && (
                <form action={revokeSession}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button type="submit" size="sm" variant="outline">Sign out</Button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-2">
          <form action={signOut}><input type="hidden" name="scope" value="local" /><Button type="submit" variant="outline" size="sm">Sign out here</Button></form>
          <form action={signOut}><input type="hidden" name="scope" value="global" /><Button type="submit" variant="destructive" size="sm">Sign out everywhere</Button></form>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">People you blocked or muted</h2>
        <p className="text-sm text-muted-foreground">Blocked people cannot see you or reach you, and are never told. Muted people are simply hidden from your feed.</p>
        {blocked.length === 0 && muted.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nobody.</p>
        ) : (
          <ul className="divide-y divide-rule rounded-md border border-rule bg-card">
            {blocked.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  {b.profile?.display_name ?? "Former member"} <span className="font-mono text-xs text-muted-foreground">@{b.profile?.campus_username}</span> · blocked
                </span>
                <form action={unblockUser.bind(null, b.blocked_id)}>
                  <Button type="submit" size="sm" variant="outline">Unblock</Button>
                </form>
              </li>
            ))}
            {muted.map((m) => (
              <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                <span>
                  {m.profile?.display_name ?? "Former member"} <span className="font-mono text-xs text-muted-foreground">@{m.profile?.campus_username}</span> · muted
                </span>
                <form action={unmuteUser.bind(null, m.muted_id, m.profile?.campus_username)}>
                  <Button type="submit" size="sm" variant="outline">Unmute</Button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">AI in your browser</h2>
        <BrowserAiToggle enabled={process.env.NEXT_PUBLIC_BROWSER_AI === "1"} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Notifications</h2>
        <PushToggle publicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""} />
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">Your data</h2>
        <p className="text-sm text-muted-foreground">
          Take everything with you, or go. The export is a zip of JSON files: your account, everything you pinned, your replies, your threads, your consents, and where you are signed in.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a href="/settings/export" className={buttonVariants({ variant: "outline", size: "sm" })} download>
            Download my data
          </a>
          <Link href="/policies/privacy" className="text-sm underline underline-offset-4">
            What we keep and why
          </Link>
        </div>
        {deletion ? (
          <div className="rounded-md border border-destructive/40 p-3 text-sm">
            <p>
              Your account is scheduled for deletion on <span className="font-medium">{new Date(deletion.scheduled_for).toLocaleDateString("en-US", { dateStyle: "long", timeZone: "America/Chicago" })}</span>. Until then it is read-only, and cancelling restores everything.
            </p>
            <form action={cancelDeletion} className="mt-2">
              <Button type="submit" size="sm" variant="outline">Cancel the deletion</Button>
            </form>
          </div>
        ) : (
          <DeleteAccount />
        )}
      </section>
    </div>
  );
}
