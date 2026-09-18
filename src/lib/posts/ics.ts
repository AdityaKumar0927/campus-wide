/** Minimal iCalendar builder for event notices. Times are emitted in UTC so every client agrees. */
export interface IcsEvent {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  startsAt: string;
  endsAt?: string;
  url?: string;
}

function stamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

const BACKSLASH = String.fromCharCode(92);

function escape(s: string): string {
  return s
    .split(BACKSLASH)
    .join(BACKSLASH + BACKSLASH)
    .replace(/;/g, `${BACKSLASH};`)
    .replace(/,/g, `${BACKSLASH},`)
    .replace(/\r?\n/g, `${BACKSLASH}n`);
}

function fold(line: string): string {
  const out: string[] = [];
  let rest = line;
  while (rest.length > 73) {
    out.push(rest.slice(0, 73));
    rest = ` ${rest.slice(73)}`;
  }
  out.push(rest);
  return out.join("\r\n");
}

export function buildIcs(e: IcsEvent): string {
  const end = e.endsAt ?? new Date(new Date(e.startsAt).getTime() + 2 * 3_600_000).toISOString();
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Campus Wide//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.uid}@campus-wide`,
    `DTSTAMP:${stamp(new Date().toISOString())}`,
    `DTSTART:${stamp(e.startsAt)}`,
    `DTEND:${stamp(end)}`,
    `SUMMARY:${escape(e.title)}`,
  ];
  if (e.location) lines.push(`LOCATION:${escape(e.location)}`);
  if (e.description) lines.push(`DESCRIPTION:${escape(e.description)}`);
  if (e.url) lines.push(`URL:${e.url}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
