"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { AppealState } from "./actions";

export function AppealForm({ action }: { action: (prev: AppealState, formData: FormData) => Promise<AppealState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  if (state.ok) return <p role="status" className="text-sm">Your appeal is in. A different moderator reads it; you will hear in your inbox.</p>;
  return (
    <form action={formAction} className="space-y-3">
      <label htmlFor="appeal-text" className="block text-sm font-medium">
        Why should this be reconsidered?
      </label>
      <textarea id="appeal-text" name="text" required minLength={10} maxLength={4000} rows={5} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Sending…" : "Send my appeal"}
      </Button>
    </form>
  );
}
