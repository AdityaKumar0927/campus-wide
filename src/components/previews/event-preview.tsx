"use client";

import { EventIcon, TickIcon } from "@/components/icons/board-icons";
import { useState } from "react";
import { Chip, PreviewNotice } from "./frame";

const event = {
  title: "Jazz night",
  where: "McCormick Tribune Campus Center, The Bog",
  start: "20261002T200000",
  end: "20261002T223000",
  desc: "Free. Bring someone who has had a long week.",
};

function downloadIcs() {
  const ics = [
    "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Campus Wide//EN", "BEGIN:VEVENT",
    `UID:preview-${event.start}@campus-wide`, `DTSTAMP:${event.start}Z`,
    `DTSTART;TZID=America/Chicago:${event.start}`, `DTEND;TZID=America/Chicago:${event.end}`,
    `SUMMARY:${event.title}`, `LOCATION:${event.where}`, `DESCRIPTION:${event.desc}`,
    "END:VEVENT", "END:VCALENDAR",
  ].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "jazz-night.ics";
  a.click();
  URL.revokeObjectURL(url);
}

export function EventPreview() {
  const [going, setGoing] = useState(false);
  return (
    <PreviewNotice stock="white" stamp="Event · Fri 2 Oct · 8:00 pm" held="tape" title="Jazz night. Free. Bring someone who has had a long week." pinHue={155} rotate="rotate-[0.5deg]">
      <p className="text-xs text-muted-foreground">{event.where}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Chip active={going} pressed={going} onClick={() => setGoing((g) => !g)}>
          {going ? <TickIcon className="size-3.5" aria-hidden /> : null} {going ? "Going" : "RSVP"} · {41 + (going ? 1 : 0)}
        </Chip>
        <Chip onClick={downloadIcs} ariaLabel="Add Jazz night to your calendar">
          <EventIcon className="size-3.5" aria-hidden /> Add to calendar (.ics)
        </Chip>
      </div>
      <ul className="flex -space-x-1.5" aria-label="Going">
        {["AL", "MS", "RT", "KJ", "+38"].map((i) => (
          <li key={i} className="flex size-6 items-center justify-center rounded-full border border-rule bg-[var(--card)] text-[9px] font-medium">{i}</li>
        ))}
      </ul>
      <p className="mt-auto text-xs text-muted-foreground">The calendar file is real: it lands in Outlook or Google Calendar with the Chicago time zone.</p>
    </PreviewNotice>
  );
}
