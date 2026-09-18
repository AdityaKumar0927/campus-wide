"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { triageReport, type Triage } from "./ai-actions";

export function TriageButton({ reportId, initial }: { reportId: string; initial: Triage | null }) {
  const [triage, setTriage] = useState<Triage | null>(initial);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-md border border-dashed border-rule p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => start(async () => setTriage((await triageReport(reportId)) ?? triage))}>
          {pending ? "Labelling…" : triage ? "Refresh AI labels" : "Ask the AI for labels"}
        </Button>
        <span className="text-xs text-muted-foreground">Suggestions for ordering only. You read the evidence; you decide.</span>
      </div>
      {triage && (
        <p className="mt-2">
          <span className="stamp">
            Suggested: {triage.suggested_category.replace("_", " ")} · severity {triage.severity}
          </span>
          <br />
          {triage.summary}
        </p>
      )}
    </div>
  );
}
