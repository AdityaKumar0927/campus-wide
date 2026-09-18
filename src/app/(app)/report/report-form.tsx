"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { REPORT_CATEGORIES } from "@/lib/moderation/constants";
import { fileReport, type ReportState } from "./actions";

const URGENT = new Set(["harassment", "stalking"]);

export function ReportForm({ targetType, targetId, contacts }: { targetType: string; targetId: string; contacts: { label: string; value: string }[] }) {
  const [state, formAction, pending] = useActionState<ReportState, FormData>(fileReport, {});
  const [category, setCategory] = useState<string>("");
  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <fieldset>
        <legend className="text-sm font-medium">What happened?</legend>
        <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
          {REPORT_CATEGORIES.map(([value, label]) => (
            <label key={value} className="flex items-start gap-2 rounded-md border border-rule bg-card px-3 py-2 text-sm has-[:checked]:border-primary">
              <input type="radio" name="category" value={value} required onChange={() => setCategory(value)} className="mt-0.5 accent-primary" />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      {URGENT.has(category) && (
        <div role="status" className="notice space-y-2 px-4 pt-5 pb-4" style={{ "--stock": "var(--stock-yellow)" } as React.CSSProperties}>
          <p className="stamp">If you are in danger, call first</p>
          <ul className="space-y-1 text-sm">
            {contacts.map((c) => (
              <li key={c.label}>
                <span className="font-medium">{c.label}:</span> {c.value}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">Moderators respond within 48 hours. Block the person now if you have not; they are not told.</p>
        </div>
      )}
      <div>
        <label htmlFor="note" className="block text-sm font-medium">
          Tell us more (optional)
        </label>
        <textarea id="note" name="note" rows={4} maxLength={4000} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="What you saw, when, and anything a moderator should know." />
        <p className="mt-1 text-xs text-muted-foreground">The item, the thread (if any), both handles, timestamps, and your block state are attached automatically.</p>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="escalation" className="mt-0.5 size-4 accent-primary" />
        <span>Moderators may pass this to campus offices (Public Safety, Dean of Students, Title IX) if they think it is warranted.</span>
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending || !category}>
        {pending ? "Filing…" : "File the report"}
      </Button>
    </form>
  );
}
