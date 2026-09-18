"use client";

import { RideIcon } from "@/components/icons/board-icons";
import { useState } from "react";
import { Chip, Person, PreviewNotice } from "./frame";

export function RidePreview() {
  const [seats, setSeats] = useState(2);
  const [taken, setTaken] = useState(false);
  return (
    <PreviewNotice stock="green" stamp="Ride · Sat 6:00 am · O'Hare" title="Two seats to the airport before fall break. Split the gas, not the playlist." pinHue={250} rotate="rotate-[0.4deg]">
      <Person initials="MA" name="Marcus A." uid="mabara" className="text-xs" />
      <p className="text-xs text-muted-foreground">Driver verified · 4 helped · leaves from Rowe Village</p>
      <div className="flex items-center gap-2">
        <span className="stamp text-foreground">{seats} seat{seats === 1 ? "" : "s"} left</span>
        <Chip
          active={taken}
          pressed={taken}
          onClick={() => {
            setTaken((t) => !t);
            setSeats((s) => (taken ? s + 1 : s - 1));
          }}
        >
          <RideIcon className="size-3.5" aria-hidden /> {taken ? "Your seat" : "Take a seat"}
        </Chip>
      </div>
      <p className="mt-auto text-xs text-muted-foreground">Costs are split in person. Rides expire the moment they leave.</p>
    </PreviewNotice>
  );
}
