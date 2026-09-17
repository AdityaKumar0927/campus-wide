"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SAFETY_RULES } from "@/lib/safety-rules";
import { completeOnboarding, type OnboardingState } from "./actions";

export function OnboardingForm({ campusUsername, namePending }: { campusUsername: string; namePending: boolean }) {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(completeOnboarding, {});
  return (
    <form action={action} className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-2xl">Your name, once.</h2>
        <p className="text-sm text-muted-foreground">
          Your handle is <span className="font-mono">@{campusUsername}</span>, straight from your campus address; it cannot be changed. Enter your name as it appears on your HawkCard. It locks after this step and is shown as
          &ldquo;First name L.&rdquo; next to your handle. A moderator can correct it in person.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="given">First name</Label>
            <Input id="given" name="given" autoComplete="given-name" required maxLength={40} disabled={!namePending} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="family">Family name</Label>
            <Input id="family" name="family" autoComplete="family-name" required maxLength={60} disabled={!namePending} />
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="age" className="mt-1 size-4 accent-primary" required />
          <span>I am 17 or older.</span>
        </label>
      </section>

      <section className="space-y-3">
        <h2 className="text-2xl">House rules and safety.</h2>
        <p className="text-sm text-muted-foreground">Read each line. Ticking it is recorded, with the policy version, as your agreement.</p>
        <ul className="space-y-2">
          {SAFETY_RULES.map((r) => (
            <li key={r.key}>
              <label className="flex items-start gap-2 rounded-md border border-rule bg-card px-3 py-2 text-sm">
                <input type="checkbox" name={`rule_${r.key}`} className="mt-1 size-4 shrink-0 accent-primary" required />
                <span>{r.text}</span>
              </label>
            </li>
          ))}
        </ul>
        <label className="flex items-start gap-2 text-sm text-muted-foreground">
          <input type="checkbox" name="marketing" className="mt-1 size-4 accent-primary" />
          <span>Optional: email me a weekly digest of what is on the board.</span>
        </label>
      </section>

      {state.error && (
        <p role="alert" className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Pinning you to the board…" : "Finish and open the board"}
      </Button>
    </form>
  );
}
