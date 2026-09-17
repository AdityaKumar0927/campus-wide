"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestCode, verifyCode, type SignInState } from "../actions";

export function SignInForm({ next, initialError }: { next: string; initialError?: string }) {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    async (prev, fd) => (prev.step === "code" ? verifyCode(prev, fd) : requestCode(prev, fd)),
    { step: "email", next, error: initialError },
  );
  const codeRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.step === "code") codeRef.current?.focus();
  }, [state.step]);

  return (
    <form action={action} className="space-y-5" aria-describedby={state.error ? "sign-in-error" : undefined}>
      <input type="hidden" name="next" value={state.next ?? next} />
      {state.step === "email" ? (
        <div className="space-y-1.5">
          <Label htmlFor="email">Campus email</Label>
          <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" required placeholder="yourUID@hawk.illinoistech.edu" autoFocus />
          <p className="text-xs text-muted-foreground">
            Students: <span className="font-mono">@hawk.illinoistech.edu</span> (or the older <span className="font-mono">@hawk.iit.edu</span>). Faculty and staff: <span className="font-mono">@illinoistech.edu</span>.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <input type="hidden" name="email" value={state.email} />
          <Label htmlFor="code">Six-digit code</Label>
          <Input ref={codeRef} id="code" name="code" inputMode="numeric" pattern="\d{6}" autoComplete="one-time-code" maxLength={6} required className="font-mono text-2xl tracking-[0.3em]" />
          <p className="text-xs text-muted-foreground">
            Sent to <span className="font-mono">{state.email}</span>. Check Outlook; the code expires in ten minutes. The email also has a one-tap link.
          </p>
        </div>
      )}
      {state.error && (
        <p id="sign-in-error" role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "One moment…" : state.step === "email" ? "Send me a code" : "Sign in"}
        </Button>
        {state.step === "code" && (
          <Link href={`/sign-in?next=${encodeURIComponent(state.next ?? next)}`} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
            Use a different address
          </Link>
        )}
      </div>
    </form>
  );
}
