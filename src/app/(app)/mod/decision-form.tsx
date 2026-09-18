"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { decide, type ModState } from "./actions";

const KINDS: { value: string; label: string; needsSubject?: boolean }[] = [
  { value: "dismiss", label: "Dismiss: nothing to act on" },
  { value: "warn", label: "Warn the member", needsSubject: true },
  { value: "hide", label: "Hide the item" },
  { value: "remove", label: "Remove the item" },
  { value: "suspend", label: "Suspend the member (days below)", needsSubject: true },
  { value: "ban", label: "Ban the member", needsSubject: true },
  { value: "privacy_mode", label: "Switch on privacy mode for the reporter's sake", needsSubject: true },
  { value: "restore", label: "Restore the item or the account" },
];

const GROUNDS = ["Community guidelines 1: be a real person", "Community guidelines 2: no harassment or threats", "Community guidelines 3: no stalking or unwanted contact", "Community guidelines 4: no scams, no payments off the board", "Marketplace rules: prohibited item", "Meal sharing policy 2: nothing is sold, lent, or traded", "Acceptable use: spam", "Other (say which)"];

export function DecisionForm({ reportId, targetType, targetId, subjectId }: { reportId: string | null; targetType: string; targetId: string; subjectId: string | null }) {
  const [state, formAction, pending] = useActionState<ModState, FormData>(decide, {});
  if (state.ok) return <p role="status" className="text-sm">Decision recorded. The member has the statement of reasons in their inbox.</p>;
  return (
    <form action={formAction} className="space-y-3 rounded-md border border-rule bg-card p-4">
      <input type="hidden" name="reportId" value={reportId ?? ""} />
      <input type="hidden" name="targetType" value={targetType} />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="subjectId" value={subjectId ?? ""} />
      <div>
        <label htmlFor="kind" className="block text-sm font-medium">
          Decision
        </label>
        <select id="kind" name="kind" required defaultValue="" className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <option value="" disabled>
            Choose
          </option>
          {KINDS.filter((k) => !k.needsSubject || subjectId).map((k) => (
            <option key={k.value} value={k.value}>
              {k.label}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="facts" className="block text-sm font-medium">
          The facts (what happened, in plain words)
        </label>
        <textarea id="facts" name="facts" rows={3} maxLength={4000} className="mt-1 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="ground" className="block text-sm font-medium">
            The ground (which rule)
          </label>
          <input id="ground" name="ground" list="grounds" maxLength={400} className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
          <datalist id="grounds">
            {GROUNDS.map((g) => (
              <option key={g} value={g} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="days" className="block text-sm font-medium">
            Days (suspension)
          </label>
          <input id="days" name="days" type="number" min={1} max={365} defaultValue={7} className="mt-1 h-9 w-28 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">The member receives these words verbatim, with their right to appeal. Nothing here is automatic.</p>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Record the decision"}
      </Button>
    </form>
  );
}
