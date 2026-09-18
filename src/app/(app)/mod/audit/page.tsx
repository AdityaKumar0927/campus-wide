import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { listAuditLog } from "@/lib/dal/moderation";
import { AuthError, requireRole } from "@/lib/dal/session";
import { formatDateTime } from "@/lib/text";

export const metadata: Metadata = { title: "Audit log" };

/** Append-only, admin-readable. Every moderation step, appeal, name declaration, and session revocation lands here. */
export default async function AuditPage() {
  try {
    await requireRole("university_admin");
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? "/sign-in?next=/mod/audit" : "/mod");
    throw e;
  }
  const rows = await listAuditLog(200);
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/mod" className="text-muted-foreground underline-offset-4 hover:underline">
          ← Moderation
        </Link>
      </nav>
      <header className="border-b border-rule pb-4">
        <Kicker>Append-only</Kicker>
        <h1 className="mt-1 text-5xl">Audit log</h1>
      </header>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing recorded yet.</p>
      ) : (
        <ol className="divide-y divide-rule rounded-md border border-rule bg-card text-sm" aria-label="Audit entries">
          {rows.map((r) => (
            <li key={r.id} className="px-4 py-2">
              <p className="stamp">
                {formatDateTime(r.created_at)} · {r.action} · {r.target_type ?? ""}
              </p>
              <p className="font-mono text-xs text-muted-foreground">{JSON.stringify(r.details)}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
