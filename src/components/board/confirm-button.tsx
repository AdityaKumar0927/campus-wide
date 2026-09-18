"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

/** Two-step destructive button: the first click asks, the second acts. No modal needed. */
export function ConfirmButton({ label, confirmLabel, onConfirm, variant = "outline" }: { label: string; confirmLabel: string; onConfirm: () => Promise<void>; variant?: "outline" | "destructive" | "ghost" }) {
  const [armed, setArmed] = useState(false);
  const [pending, startTransition] = useTransition();
  if (!armed) {
    return (
      <Button type="button" size="sm" variant={variant} onClick={() => setArmed(true)}>
        {label}
      </Button>
    );
  }
  return (
    <span className="inline-flex items-center gap-2">
      <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => startTransition(() => onConfirm())}>
        {pending ? "Working…" : confirmLabel}
      </Button>
      <Button type="button" size="sm" variant="ghost" onClick={() => setArmed(false)}>
        Keep it
      </Button>
    </span>
  );
}
