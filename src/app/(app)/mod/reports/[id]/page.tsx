import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { getReport, listActionsForReport, type StatementOfReasons } from "@/lib/dal/moderation";
import { formatDateTime } from "@/lib/text";
import { DecisionForm } from "../../decision-form";
import { requireModerator } from "../../page";

export const metadata: Metadata = { title: "Report" };

const LINK: Record<string, (id: string, ev: Record<string, unknown>) => string> = {
  post: (id) => `/p/${id}`,
  comment: (id, ev) => `/p/${(ev.comment as { post_id?: string })?.post_id ?? ""}#c-${id}`,
  thread: (id) => `/t/${id}`,
  profile: (id, ev) => `/u/${(ev.profile as { campus_username?: string })?.campus_username ?? id}`,
};

export default async function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireModerator(`/mod/reports/${id}`);
  const report = await getReport(id);
  if (!report) notFound();
  const actions = await listActionsForReport(report.id);
  const ev = report.evidence as Record<string, unknown>;
  const reporter = ev.reporter as { display_name?: string; campus_username?: string } | undefined;
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/mod" className="text-muted-foreground underline-offset-4 hover:underline">
          ← Moderation
        </Link>
      </nav>
      <header className="border-b border-rule pb-4">
        <Kicker>
          {report.case_number} · {report.status} · filed {formatDateTime(report.created_at)}
          {(ev.urgent as boolean) ? " · urgent" : ""}
        </Kicker>
        <h1 className="mt-1 text-4xl">{report.category.replace("_", " ")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Reported by {reporter?.display_name ?? "a member"} (@{reporter?.campus_username ?? "?"}) about {report.subject?.display_name ?? "a former member"}
          {report.subject ? ` (@${report.subject.campus_username})` : ""}. {report.escalation_consent ? "The reporter consents to escalation to campus offices." : "No consent to escalate; ask before involving campus offices."}
        </p>
      </header>
      {report.note && <p className="whitespace-pre-wrap rounded-md border border-rule bg-card p-4 text-sm">{report.note}</p>}
      <section className="space-y-2">
        <h2 className="text-2xl">Evidence, captured at filing</h2>
        <p className="text-sm">
          <Link href={LINK[report.target_type]?.(report.target_id, ev) ?? "#"} className="underline underline-offset-4">
            Open the {report.target_type} as it is now
          </Link>
          {" · "}reporter had blocked the subject: {(ev.reporter_blocked_subject as boolean) ? "yes" : "no"}
        </p>
        <pre className="max-h-96 overflow-auto rounded-md border border-rule bg-muted p-3 text-xs whitespace-pre-wrap">{JSON.stringify(ev, null, 2)}</pre>
      </section>
      {actions.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-2xl">Decisions so far</h2>
          <ul className="space-y-2">
            {actions.map((a) => {
              const s = a.statement_of_reasons as unknown as StatementOfReasons;
              return (
                <li key={a.id} className="rounded-md border border-rule bg-card p-4 text-sm">
                  <p className="stamp">
                    {a.kind.replace("_", " ")} · {formatDateTime(a.created_at)}
                    {a.reversed_at ? " · reversed" : ""}
                  </p>
                  <p className="mt-1">{s.facts}</p>
                  <p className="mt-1 text-muted-foreground">{s.ground}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      {report.status === "open" || report.status === "in_review" ? (
        <DecisionForm reportId={report.id} targetType={report.target_type} targetId={report.target_id} subjectId={report.subject_id} />
      ) : (
        <p className="text-sm text-muted-foreground">This report is resolved.</p>
      )}
    </div>
  );
}
