import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Kicker } from "@/components/kicker";
import { getAction, getAppealForAction, type StatementOfReasons } from "@/lib/dal/moderation";
import { getSession } from "@/lib/dal/session";
import { formatDateTime } from "@/lib/text";
import { fileAppeal } from "./actions";
import { AppealForm } from "./appeal-form";

export const metadata: Metadata = { title: "Moderation decision" };

const KIND: Record<string, string> = { hide: "Hidden", remove: "Removed", warn: "Warning", suspend: "Suspended", ban: "Banned", restore: "Restored", dismiss: "Dismissed", privacy_mode: "Privacy mode applied" };

/** The statement of reasons (DSA Art. 17) and the one appeal the subject may file. */
export default async function DecisionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [action, session] = await Promise.all([getAction(id), getSession()]);
  if (!action || !session) notFound();
  const s = action.statement_of_reasons as unknown as StatementOfReasons;
  const appeal = await getAppealForAction(action.id);
  const mine = action.subject_id === session.userId;
  const window = new Date(action.created_at).getTime() + 14 * 86_400_000 > new Date().getTime();
  return (
    <div className="space-y-6">
      <header className="border-b border-rule pb-4">
        <Kicker>Statement of reasons · {formatDateTime(action.created_at)}</Kicker>
        <h1 className="mt-1 text-5xl">{KIND[action.kind] ?? action.kind}</h1>
        {action.reversed_at && <p className="mt-2 text-sm text-primary">Reversed on appeal, {formatDateTime(action.reversed_at)}.</p>}
      </header>
      <dl className="space-y-3 rounded-md border border-rule bg-card p-4 text-sm">
        <div>
          <dt className="stamp">The facts</dt>
          <dd className="mt-1 whitespace-pre-wrap">{s.facts}</dd>
        </div>
        <div>
          <dt className="stamp">The ground</dt>
          <dd className="mt-1">{s.ground}</dd>
        </div>
        {s.duration_days && (
          <div>
            <dt className="stamp">For how long</dt>
            <dd className="mt-1">{s.duration_days} days</dd>
          </div>
        )}
        <div>
          <dt className="stamp">Decided by</dt>
          <dd className="mt-1">A human moderator. {s.automated ? "" : "No automated system took this decision."}</dd>
        </div>
        <div>
          <dt className="stamp">Your options</dt>
          <dd className="mt-1">{s.redress}</dd>
        </div>
      </dl>
      {mine && (
        <section aria-labelledby="appeal-heading" className="space-y-3">
          <h2 id="appeal-heading" className="text-2xl">
            Appeal
          </h2>
          {appeal ? (
            <div className="rounded-md border border-rule bg-card p-4 text-sm">
              <p className="stamp">
                {appeal.status === "open" ? "Waiting for a different moderator" : appeal.status === "overturned" ? "Overturned" : "Decision upheld"} · {formatDateTime(appeal.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{appeal.text}</p>
              {appeal.decision_reasons && <p className="mt-2 border-t border-rule pt-2">{appeal.decision_reasons}</p>}
            </div>
          ) : action.reversed_at ? null : window ? (
            <AppealForm action={fileAppeal.bind(null, action.id)} />
          ) : (
            <p className="text-sm text-muted-foreground">The 14-day appeal window has closed.</p>
          )}
        </section>
      )}
    </div>
  );
}
