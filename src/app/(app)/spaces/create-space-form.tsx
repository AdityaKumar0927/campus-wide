"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { createSpace, type SpaceFormState } from "./actions";

export function CreateSpaceForm() {
  const [state, formAction, pending] = useActionState<SpaceFormState, FormData>(createSpace, {});
  return (
    <form action={formAction} className="notice space-y-3 px-4 pt-5 pb-4" style={{ "--stock": "var(--stock-manila)" } as React.CSSProperties}>
      <p className="stamp">Start a space</p>
      <div>
        <label htmlFor="space-name" className="block text-sm font-medium">
          Name
        </label>
        <input id="space-name" name="name" required minLength={3} maxLength={60} className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" placeholder="CHEM 239, Rowe Village 4th floor, Chess club" />
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <label htmlFor="space-description" className="block text-sm font-medium">
            One line about it
          </label>
          <input id="space-description" name="description" maxLength={300} className="mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
        </div>
        <div>
          <label htmlFor="space-kind" className="block text-sm font-medium">
            Kind
          </label>
          <select id="space-kind" name="kind" defaultValue="interest" className="mt-1 h-9 rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
            <option value="course">Course</option>
            <option value="residence">Residence</option>
            <option value="club">Club</option>
            <option value="interest">Interest</option>
          </select>
        </div>
      </div>
      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Creating…" : "Create the space"}
      </Button>
    </form>
  );
}
