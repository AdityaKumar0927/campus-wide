"use client";

import { useState } from "react";
import { Chip, PreviewNotice } from "./frame";

const members = ["AL", "MS", "RT", "KJ", "PK"];

export function StudyPreview() {
  const [joined, setJoined] = useState(false);
  const count = members.length + (joined ? 1 : 0);
  return (
    <PreviewNotice stock="blue" stamp="Study group · CHEM 239 · Thursdays 7 pm" held="tape" title="Organic chem, section 3. Galvin Library, second floor, near the windows." rotate="-rotate-[0.5deg]">
      <ul className="flex -space-x-1.5" aria-label="Members">
        {members.map((m) => (
          <li key={m} className="flex size-6 items-center justify-center rounded-full border border-rule bg-[var(--card)] text-[9px] font-medium">{m}</li>
        ))}
        {joined && <li className="flex size-6 items-center justify-center rounded-full border border-primary bg-primary text-[9px] font-medium text-primary-foreground">JD</li>}
      </ul>
      <div className="flex items-center gap-2">
        <Chip active={joined} pressed={joined} onClick={() => setJoined((j) => !j)}>{joined ? "Joined" : "Join"} · {count}/8</Chip>
        <span className="text-xs text-muted-foreground">{8 - count} spots left</span>
      </div>
      <p className="mt-auto text-xs text-muted-foreground">Groups close at eight and reopen each term.</p>
    </PreviewNotice>
  );
}
