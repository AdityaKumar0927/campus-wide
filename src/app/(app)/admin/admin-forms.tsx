"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { addDomain, findMember, saveSafeSpots, updateCampus, updatePolicyText, type AdminState } from "./actions";

const input = "mt-1 h-9 w-full rounded-md border border-input bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50";

function Status({ state }: { state: AdminState }) {
  if (state.error) return <p role="alert" className="text-sm text-destructive">{state.error}</p>;
  if (state.ok) return <p role="status" className="text-sm text-primary">{state.ok}</p>;
  return null;
}

export function CampusForm({ name, shortName, accentHue, timezone }: { name: string; shortName: string; accentHue: string; timezone: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updateCampus, {});
  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      <label className="text-sm font-medium">Name<input name="name" defaultValue={name} required className={input} /></label>
      <label className="text-sm font-medium">Short name<input name="shortName" defaultValue={shortName} required className={input} /></label>
      <label className="text-sm font-medium">Accent hue (0-360)<input name="accentHue" type="number" min={0} max={360} defaultValue={accentHue} className={input} /></label>
      <label className="text-sm font-medium">Time zone<input name="timezone" defaultValue={timezone} className={input} /></label>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Button type="submit" size="sm" disabled={pending}>Save campus</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function PolicyForm({ policyKey, label, text }: { policyKey: string; label: string; text: string }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(updatePolicyText, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="key" value={policyKey} />
      <label htmlFor={`policy-${policyKey}`} className="block text-sm font-medium">{label}</label>
      <textarea id={`policy-${policyKey}`} name="text" defaultValue={text} rows={4} maxLength={4000} className="w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>Save</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function SpotsForm({ spots }: { spots: { name: string; note?: string; campus?: string }[] }) {
  const [state, action, pending] = useActionState<AdminState, FormData>(saveSafeSpots, {});
  return (
    <form action={action} className="space-y-2">
      <label htmlFor="spots" className="block text-sm font-medium">Safe-exchange spots (one per line: name | note | campus)</label>
      <textarea id="spots" name="spots" rows={5} defaultValue={spots.map((s) => [s.name, s.note ?? "", s.campus ?? ""].join(" | ")).join("\n")} className="w-full rounded-md border border-input bg-card px-3 py-2 font-mono text-xs outline-none focus-visible:ring-3 focus-visible:ring-ring/50" />
      <div className="flex items-center gap-3">
        <Button type="submit" size="sm" variant="outline" disabled={pending}>Save spots</Button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function DomainForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(addDomain, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="text-sm font-medium">Domain<input name="domain" placeholder="hawk.example.edu" required className={input} /></label>
      <label className="text-sm font-medium">Role<select name="role" defaultValue="student" className={input}><option value="student">Student</option><option value="staff">Staff</option></select></label>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>Add domain</Button>
      <Status state={state} />
    </form>
  );
}

export function FindMemberForm() {
  const [state, action, pending] = useActionState<AdminState, FormData>(findMember, {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-2">
      <label className="text-sm font-medium">Handle<input name="username" placeholder="jdoe01" required className={input} /></label>
      <Button type="submit" size="sm" variant="outline" disabled={pending}>Find</Button>
      <Status state={state} />
    </form>
  );
}
