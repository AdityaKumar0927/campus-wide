"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { findPaymentWords } from "@/lib/relay/payment-words";
import type { MessageState } from "./actions";

export function MessageForm({ action }: { action: (prev: MessageState, formData: FormData) => Promise<MessageState> }) {
  const [state, formAction, pending] = useActionState(action, {});
  const [words, setWords] = useState<string[]>([]);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={formAction} onReset={() => setWords([])} className="space-y-2">
      <label htmlFor="message-body" className="sr-only">
        Message
      </label>
      <textarea
        id="message-body"
        name="body"
        required
        maxLength={2000}
        rows={3}
        placeholder="Keep it on the board. Suggest a public spot and a time."
        onChange={(e) => setWords(findPaymentWords(e.target.value))}
        className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {words.length > 0 && (
        <p role="status" className="rounded-md border border-rule bg-[var(--stock-yellow)] px-3 py-2 text-xs">
          Careful: {words.join(", ")}. Nothing on this board is paid for, and moving off the app is how scams start. You can still send it; the other side sees the same caution.
        </p>
      )}
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Sending…" : "Send"}
      </Button>
    </form>
  );
}
