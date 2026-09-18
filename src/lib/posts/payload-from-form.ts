import { parsePayload, type PostType } from "./types";

/** Minutes east of UTC for a zone at an instant, via Intl (no date library). */
function tzOffsetMinutes(ms: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const parts = Object.fromEntries(dtf.formatToParts(new Date(ms)).map((p) => [p.type, p.value]));
  const asUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return (asUtc - ms) / 60_000;
}

/** A datetime-local value typed on campus is campus time; convert it to an ISO instant. */
export function localToIso(local: string, tz: string): string | null {
  const m = local.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const guess = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
  let utc = guess - tzOffsetMinutes(guess, tz) * 60_000;
  const second = tzOffsetMinutes(utc, tz);
  if (second !== tzOffsetMinutes(guess, tz)) utc = guess - second * 60_000;
  return new Date(utc).toISOString();
}

function str(fd: FormData, key: string, max = 200): string {
  const v = fd.get(key);
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
function num(fd: FormData, key: string): number | null {
  const v = str(fd, key, 20);
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function dollarsToCents(fd: FormData, key: string): number | null {
  const n = num(fd, key);
  return n === null ? null : Math.round(n * 100);
}

export interface FormPayload {
  payload: Record<string, unknown>;
  audience: "campus" | "meal_holders";
  error?: string;
}

/** Builds the type-specific payload from the composer fields and validates it with the Zod schema. */
export function payloadFromForm(type: PostType, fd: FormData, tz: string): FormPayload {
  let payload: Record<string, unknown> = {};
  let audience: FormPayload["audience"] = "campus";
  switch (type) {
    case "event": {
      const startsAt = localToIso(str(fd, "startsAt", 30), tz);
      if (!startsAt) return { payload, audience, error: "Pick a start date and time." };
      const endsAt = localToIso(str(fd, "endsAt", 30), tz) ?? undefined;
      const rsvpLimit = num(fd, "rsvpLimit");
      payload = { startsAt, ...(endsAt ? { endsAt } : {}), location: str(fd, "location"), ...(rsvpLimit ? { rsvpLimit } : {}) };
      break;
    }
    case "listing": {
      const free = fd.get("free") === "on";
      payload = { priceCents: free ? null : dollarsToCents(fd, "price"), condition: str(fd, "condition", 20) || "good", category: str(fd, "category", 40) || "other" };
      if (!free && payload.priceCents === null) return { payload, audience, error: "Give it a price, or tick free." };
      break;
    }
    case "meal": {
      const mode = str(fd, "mealMode", 10) === "request" ? "request" : "offer";
      audience = mode === "request" ? "meal_holders" : "campus";
      payload = { kind: "guest_meal_treat", location: str(fd, "location", 120) || "The Commons", window: [str(fd, "mealDate", 20), str(fd, "mealPeriod", 40)].filter(Boolean).join(" ") };
      if (!payload.window) return { payload, audience, error: "Pick a day and a meal period." };
      break;
    }
    case "lost":
    case "found": {
      payload = { where: str(fd, "where", 160), when: str(fd, "when", 80), category: str(fd, "category", 40) || "other" };
      if (type === "found" && str(fd, "heldAt", 160)) payload.heldAt = str(fd, "heldAt", 160);
      if (!payload.where) return { payload, audience, error: type === "lost" ? "Where did you last have it?" : "Where did you find it?" };
      break;
    }
    case "ride": {
      const departsAt = localToIso(str(fd, "departsAt", 30), tz);
      if (!departsAt) return { payload, audience, error: "When does the ride leave?" };
      payload = { from: str(fd, "from", 120), to: str(fd, "to", 120), departsAt, seats: num(fd, "seats") ?? 1, costSplit: fd.get("costSplit") === "on" };
      if (!payload.from || !payload.to) return { payload, audience, error: "Where from, and where to?" };
      break;
    }
    case "study": {
      const capacity = num(fd, "capacity");
      payload = { course: str(fd, "course", 40), meets: str(fd, "meets", 120), location: str(fd, "location", 120), ...(capacity ? { capacity } : {}) };
      if (!payload.course) return { payload, audience, error: "Which course or topic?" };
      break;
    }
    case "roommate": {
      const kind = str(fd, "kind", 10);
      payload = { kind: ["sublet", "roommate", "looking"].includes(kind) ? kind : "roommate", rentCents: dollarsToCents(fd, "rent"), moveIn: str(fd, "moveIn", 20), ...(str(fd, "moveOut", 20) ? { moveOut: str(fd, "moveOut", 20) } : {}), location: str(fd, "location", 160) };
      if (!payload.moveIn) return { payload, audience, error: "When does it start?" };
      break;
    }
    case "poll": {
      const options = fd.getAll("option").filter((o): o is string => typeof o === "string").map((o) => o.trim().slice(0, 80)).filter(Boolean);
      payload = { options, multiple: fd.get("multiple") === "on" };
      if (options.length < 2) return { payload, audience, error: "Give people at least two options." };
      break;
    }
    default:
      payload = {};
  }
  const parsed = parsePayload(type, payload);
  if (!parsed.success) return { payload, audience, error: parsed.error.issues[0]?.message ?? "Check the details." };
  return { payload: parsed.data as Record<string, unknown>, audience };
}
