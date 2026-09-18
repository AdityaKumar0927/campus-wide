import type { Metadata } from "next";
import Link from "next/link";
import { Kicker } from "@/components/kicker";
import { listAppeals, type StatementOfReasons } from "@/lib/dal/moderation";
import { formatDateTime } from "@/lib/text";
import { requireModerator } from "../page";
import { AppealDecisionForm } from "./appeal-decision-form";

export const metadata: Metadata = { title: "Appeals" };

export default async function AppealsPage({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  const session = await requireModerator("/mod/appeals");
  const { show } = await searchParams;
  const appeals = await listAppeals(show === "decided" ? "decided" : "open");
  return (
    <div className="space-y-6">
      <nav aria-label="Breadcrumb" className="text-sm">
        <Link href="/mod" className="text-muted-foreground underline-offset-4 hover:underline">
          ← Moderation
        </Link>
      </nav>
      <header className="border-b border-rule pb-4">
        <Kicker>A different moderator decides</Kicker>
        <h1 className="mt-1 text-5xl">Appeals</h1>
        <p className="mt-2 text-sm">
          <Link href="/mod/appeals" className="underline underline-offset-4">
            Open
          </Link>
          {" · "}
          <Link href="/mod/appeals?show=decided" className="underline underline-offset-4">
            Decided
          </Link>
        </p>
      </header>
      {appeals.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing here.</p>
      ) : (
        <ol className="space-y-4" aria-label="Appeals">
          {appeals.map((a) => {
            const s = a.action?.statement_of_reasons as unknown as StatementOfReasons | undefined;
            const ownDecision = a.action?.moderator_id === session.userId && session.membership?.campusRole !== "university_admin";
            return (
              <li key={a.id} className="rounded-md border border-rule bg-card p-4 text-sm">
                <p className="stamp">
                  {a.status} · {formatDateTime(a.created_at)} · {a.action?.kind.replace("_", " ")} against {a.action?.subject?.display_name ?? "a former member"}
                </p>
                <p className="mt-2 whitespace-pre-wrap">{a.text}</p>
                {s && (
                  <p className="mt-2 border-t border-rule pt-2 text-muted-foreground">
                    Original decision: {s.facts} ({s.ground})
                  </p>
                )}
                {a.decision_reasons && <p className="mt-2 border-t border-rule pt-2">Decision: {a.decision_reasons}</p>}
                {a.status === "open" && (ownDecision ? <p className="mt-2 text-xs text-muted-foreground">You made this decision; someone else has to hear the appeal.</p> : <AppealDecisionForm appealId={a.id} />)}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
