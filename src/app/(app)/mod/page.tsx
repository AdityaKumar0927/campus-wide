import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { listReports } from "@/lib/dal/moderation";
import { AuthError, requireRole } from "@/lib/dal/session";
import { relativeTime } from "@/lib/text";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Moderation" };

export async function requireModerator(next: string) {
  try {
    return await requireRole("moderator");
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? `/sign-in?next=${encodeURIComponent(next)}` : "/feed");
    throw e;
  }
}

export default async function ModQueuePage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireModerator("/mod");
  const { show } = await searchParams;
  const status = show === "resolved" ? "resolved" : "open";
  const reports = await listReports(status);
  const now = new Date();
  const tab = (key: string, label: string, href: string) => (
    <Link href={href} aria-current={status === key ? "page" : undefined} className={cn("border-b-2 px-1 pb-2 text-sm font-medium", status === key ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
      {label}
    </Link>
  );
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>Humans take things down, with reasons</Kicker>
        <h1 className="mt-1 text-5xl">Moderation</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">Answer within 48 hours. Every decision carries a statement of reasons and can be appealed once, to a different moderator.</p>
      </header>
      <nav aria-label="Show" className="flex gap-5 border-b border-rule">
        {tab("open", "Open reports", "/mod")}
        {tab("resolved", "Resolved", "/mod?show=resolved")}
        <Link href="/mod/appeals" className="border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          Appeals
        </Link>
        <Link href="/mod/audit" className="border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-muted-foreground hover:text-foreground">
          Audit log
        </Link>
      </nav>
      {reports.length === 0 ? (
        <p className="text-sm text-muted-foreground">{status === "open" ? "Nothing waiting. Go outside." : "Nothing resolved yet."}</p>
      ) : (
        <ol className="divide-y divide-rule rounded-md border border-rule bg-card" aria-label="Reports">
          {reports.map((r) => {
            const urgent = (r.evidence as { urgent?: boolean }).urgent;
            return (
              <li key={r.id} className="px-4 py-3">
                <p className="stamp">
                  {r.case_number} · {r.category.replace("_", " ")} · {r.target_type} · {relativeTime(r.created_at, now)}
                  {urgent ? " · urgent" : ""}
                  {r.status !== "open" ? ` · ${r.status}` : ""}
                </p>
                <Link href={`/mod/reports/${r.id}`} className="mt-0.5 block font-medium underline-offset-4 hover:underline">
                  {r.subject?.display_name ?? "Former member"}
                  {r.subject ? ` (@${r.subject.campus_username})` : ""}: {r.note ? r.note.slice(0, 120) : "no note"}
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
