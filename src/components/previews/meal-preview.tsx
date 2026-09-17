"use client";

import { MealIcon } from "@/components/icons/board-icons";
import { useState } from "react";
import { Chip, Person, PreviewNotice } from "./frame";

export function MealPreview() {
  const [state, setState] = useState<"open" | "requested" | "confirmed">("open");
  return (
    <PreviewNotice stock="green" stamp="Meal gift · The Commons · Tonight 5:30–7:00" title="Two guest meals to give away before Sunday. First-years welcome." pinHue={155} rotate="rotate-[0.7deg]">
      <Person initials="SR" name="Sam R." uid="srivera2" className="text-xs" />
      <p className="text-xs text-muted-foreground">All Access plan · self-reported · 10 guest meals per semester</p>
      <div className="flex flex-wrap items-center gap-2">
        {state === "open" && (
          <Chip onClick={() => setState("requested")}>
            <MealIcon className="size-3.5" aria-hidden /> Ask for one
          </Chip>
        )}
        {state === "requested" && (
          <>
            <span className="stamp text-foreground">Requested. Waiting for Sam…</span>
            <Chip onClick={() => setState("confirmed")}>Sam accepted</Chip>
          </>
        )}
        {state === "confirmed" && <span className="stamp text-foreground">Meet at the Commons register, 5:30. Sam taps you in.</span>}
      </div>
      <p className="mt-auto text-xs text-muted-foreground">Gift only. The plan holder is present and taps their own HawkCard; nothing is sold, lent, or traded. Off until Residence Life confirms.</p>
    </PreviewNotice>
  );
}
