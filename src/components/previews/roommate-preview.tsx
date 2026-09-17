"use client";

import { useState } from "react";
import { Chip, PreviewNotice } from "./frame";

export function RoommatePreview() {
  const [interested, setInterested] = useState(false);
  return (
    <PreviewNotice stock="pink" stamp="Sublet · Spring 2027 · expires in 12 days" title="One room in a two-bed near 31st and Michigan, January to May. $850 a month, utilities in." rotate="rotate-[0.6deg]">
      <ul className="flex flex-wrap gap-1.5 text-[11px]" aria-label="Details">
        {["Furnished", "Quiet", "No smoking", "Cats OK"].map((t) => (
          <li key={t} className="rounded-full border border-rule bg-[var(--card)] px-2 py-0.5">{t}</li>
        ))}
      </ul>
      <div className="flex items-center gap-2">
        <Chip active={interested} pressed={interested} onClick={() => setInterested((i) => !i)}>{interested ? "Interested · thread opened" : "Interested"}</Chip>
      </div>
      <p className="mt-auto text-xs text-muted-foreground">Listings take themselves down. Never pay a deposit through a chat.</p>
    </PreviewNotice>
  );
}
