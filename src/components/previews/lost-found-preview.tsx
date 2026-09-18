"use client";

import { useState } from "react";
import { Chip, PreviewNotice } from "./frame";

const items = {
  found: [
    { id: "keys", text: "Keys with a duck keychain, outside the chemistry building", where: "Wishnick Hall" },
    { id: "bottle", text: "Blue Hydro Flask with a cat sticker", where: "Galvin Library, 3F" },
  ],
  lost: [
    { id: "calc", text: "TI-84 with a name label on the back", where: "Rettaliata, room 104" },
  ],
};

export function LostFoundPreview() {
  const [tab, setTab] = useState<"found" | "lost">("found");
  const [claimed, setClaimed] = useState<string | null>(null);
  return (
    <PreviewNotice stock="yellow" stamp="Lost & found · this week" title="Post what you found. Claim what you lost." rotate="-rotate-[0.8deg]">
      <div className="flex gap-2" aria-label="Lost or found">
        <Chip active={tab === "found"} pressed={tab === "found"} onClick={() => setTab("found")}>Found · {items.found.length}</Chip>
        <Chip active={tab === "lost"} pressed={tab === "lost"} onClick={() => setTab("lost")}>Lost · {items.lost.length}</Chip>
      </div>
      <ul className="space-y-2">
        {items[tab].map((it) => (
          <li key={it.id} className="rounded-md border border-rule bg-[var(--card)] p-2.5">
            <p className="text-[13px] leading-snug">{it.text}</p>
            <p className="mt-1 text-[11px] text-muted-foreground">{it.where}</p>
            <div className="mt-2">
              {claimed === it.id ? (
                <span className="stamp text-foreground">Claim sent. Describe it in the thread.</span>
              ) : (
                <Chip onClick={() => setClaimed(it.id)}>{tab === "found" ? "That is mine" : "I found this"}</Chip>
              )}
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-auto text-xs text-muted-foreground">Finder and owner talk through the board; hand-off at a public desk.</p>
    </PreviewNotice>
  );
}
