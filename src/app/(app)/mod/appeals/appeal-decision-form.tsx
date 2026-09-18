"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { decideAppeal, type ModState } from "../actions";

export function AppealDecisionForm({ appealId }: { appealId: string }) {
  const [state, formAction, pending] = useActionState<ModState, FormData>(decideAppeal, {});
  if (state.ok) return <p role="status" className="text-sm">Decided: {state.ok}. The member has been told.</p>;
  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="appealId" value={appealId} />
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">
          <input type="radio" name="outcome" value="upheld" defaultChecked className="accent-primary" /> Uphold the decision
        </label>
        <label className="flex items-center gap-2">
          <input type="radio" name="outcome" value="overturned" className="accent-primary" /> Overturn and restore
        </label>
      </div>
      <label htmlFor={`reasons-${appealId}`} className="sr-only">
        Reasons
      </label>
      <textarea id={`reasons-${appealId}`} name="reasons" required minLength={10} maxLength={2000} rows={3} placeholder="Your reasons, sent to the member verbatim." className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Deciding…" : "Decide"}
      </Button>
    </form>
  );
}
