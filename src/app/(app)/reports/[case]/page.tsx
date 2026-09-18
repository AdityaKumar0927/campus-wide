import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { getReportByCase, listActionsForReport, type StatementOfReasons } from "@/lib/dal/moderation";
import { formatDateTime } from "@/lib/text";

export const metadata: Metadata = { title: "Report status" };

const STATUS: Record<string, string> = { open: "Waiting for a moderator", in_review: "Being reviewed", actioned: "Actioned", dismissed: "Reviewed, no action taken" };

export default async function ReportStatusPage({ params }: { params: Promise<{ case: string }> }) {
  const { case: caseNumber } = await params;
  const report = await getReportByCase(caseNumber);
  if (!report) notFound();
  const actions = await listActionsForReport(report.id);
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>Case {report.case_number}</Kicker>
        <h1 className="mt-1 text-5xl">{STATUS[report.status] ?? report.status}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Filed {formatDateTime(report.created_at)}. Keep this number; quote it if you contact campus offices.</p>
      </header>
      <dl className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-muted-foreground">What</dt>
          <dd>{report.category.replace("_", " ")}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="w-28 shrink-0 text-muted-foreground">Evidence</dt>
          <dd>Captured automatically at filing time</dd>
        </div>
        {report.resolved_at && (
          <div className="flex gap-2">
            <dt className="w-28 shrink-0 text-muted-foreground">Resolved</dt>
            <dd>{formatDateTime(report.resolved_at)}</dd>
          </div>
        )}
      </dl>
      {actions.length > 0 && (
        <section className="space-y-2" aria-labelledby="outcome">
          <h2 id="outcome" className="text-2xl">
            What the moderators did
          </h2>
          <ul className="space-y-2">
            {actions.map((a) => {
              const s = a.statement_of_reasons as unknown as StatementOfReasons;
              return (
                <li key={a.id} className="rounded-md border border-rule bg-card p-4 text-sm">
                  <p className="stamp">
                    {a.kind.replace("_", " ")} · {formatDateTime(a.created_at)}
                    {a.reversed_at ? " · reversed on appeal" : ""}
                  </p>
                  <p className="mt-1">{s.ground}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}
      <p className="text-sm text-muted-foreground">
        Reports of threats or stalking: if you are in danger, call Public Safety at 312.808.6300 or 911.{" "}
        <Link href="/#safety" className="underline underline-offset-4">
          House rules and safety
        </Link>
      </p>
    </div>
  );
}
