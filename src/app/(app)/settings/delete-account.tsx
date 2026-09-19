"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { requestDeletion, type DeletionState } from "./danger-actions";

/** Two steps and a typed phrase: nobody deletes an account by mis-tapping. */
export function DeleteAccount() {
  const [armed, setArmed] = useState(false);
  const [state, formAction, pending] = useActionState<DeletionState, FormData>(requestDeletion, {});
  if (!armed) {
    return (
      <Button type="button" variant="outline" onClick={() => setArmed(true)}>
        Delete my account
      </Button>
    );
  }
  return (
    <form action={formAction} className="space-y-3 rounded-md border border-destructive/40 p-3">
      <p className="text-sm">
        Your notices become <span className="font-medium">Former member</span>, your identity is purged after 30 days, and threads you were reported in stay under a pseudonymous key for the retention period. Signing in and cancelling inside the 30 days undoes all of it.
      </p>
      <label htmlFor="confirm" className="block text-sm font-medium">
        Type <span className="font-mono">delete my account</span>
      </label>
      <input id="confirm" name="confirm" autoComplete="off" className="h-9 w-full max-w-xs rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" size="sm" disabled={pending}>
          {pending ? "Starting…" : "Delete and sign out"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setArmed(false)}>
          Keep my account
        </Button>
      </div>
    </form>
  );
}
