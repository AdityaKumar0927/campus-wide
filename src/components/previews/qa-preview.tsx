"use client";

import { CheckCircle2Icon, HeartHandshakeIcon } from "lucide-react";
import { useState } from "react";
import { Chip, Person, PreviewNotice } from "./frame";

const answers = [
  { id: 1, who: { initials: "PK", name: "Priya K.", uid: "pkumar3" }, text: "Yes, but only the 10pm and midnight runs during reading week. The 2am one comes back with finals.", accepted: true, thanks: 6 },
  { id: 2, who: { initials: "DO", name: "Dan O.", uid: "dokafor" }, text: "Public Safety escorts still run 24/7 on campus if you miss it: 312.808.6310.", accepted: false, thanks: 3 },
];

export function QaPreview() {
  const [thanked, setThanked] = useState<Record<number, boolean>>({});
  return (
    <PreviewNotice stock="blue" stamp="Question · 2h ago · 2 answers" title="Does the 2am library shuttle still run during reading week?" rotate="-rotate-[0.6deg]">
      <Person initials="JD" name="Jane D." uid="jdoe01" className="text-xs" />
      <ol className="space-y-2">
        {answers.map((a) => (
          <li key={a.id} className="rounded-md border border-rule bg-[var(--card)] p-2.5">
            <div className="flex items-center justify-between gap-2">
              <Person initials={a.who.initials} name={a.who.name} uid={a.who.uid} className="text-xs" />
              {a.accepted && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-primary uppercase">
                  <CheckCircle2Icon className="size-3.5" aria-hidden /> Accepted
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[13px] leading-snug">{a.text}</p>
            <div className="mt-2">
              <Chip
                active={!!thanked[a.id]}
                pressed={!!thanked[a.id]}
                onClick={() => setThanked((t) => ({ ...t, [a.id]: !t[a.id] }))}
                ariaLabel={`Thank ${a.who.name}`}
              >
                <HeartHandshakeIcon className="size-3.5" aria-hidden /> Thank you · {a.thanks + (thanked[a.id] ? 1 : 0)}
              </Chip>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-auto text-xs text-muted-foreground">Accepted answers stay pinned. Thank-yous count as &ldquo;helped&rdquo;, not karma.</p>
    </PreviewNotice>
  );
}
