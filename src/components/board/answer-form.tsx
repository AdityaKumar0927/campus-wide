"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import type { CommentState } from "@/app/(app)/p/[id]/actions";

export function AnswerForm({
  action,
  label,
  placeholder,
  submitLabel,
}: {
  action: (prev: CommentState, formData: FormData) => Promise<CommentState>;
  label: string;
  placeholder: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} className="space-y-3">
      <label htmlFor="answer-body" className="block text-sm font-medium">
        {label}
      </label>
      <textarea
        id="answer-body"
        name="body"
        required
        minLength={2}
        maxLength={5000}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Pinning…" : submitLabel}
        </Button>
        <span className="text-xs text-muted-foreground">Plain text. Links work. Be the person you would want to run into.</span>
      </div>
    </form>
  );
}
