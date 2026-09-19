"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import type { ConsentState } from "./actions";

export function ConsentForm({ ids, action }: { ids: string[]; action: (prev: ConsentState, formData: FormData) => Promise<ConsentState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-3">
      {ids.map((id) => (
        <input key={id} type="hidden" name="policy" value={id} />
      ))}
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="accept" required className="mt-0.5 size-4 accent-primary" />
        <span>I have read {ids.length === 1 ? "it" : "them"} and I accept.</span>
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Recording…" : "Accept and continue"}
      </Button>
    </form>
  );
}
