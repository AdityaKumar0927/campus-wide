import { formatCents, formatDateTime } from "@/lib/text";
import type { PostType } from "./types";

const CONDITION: Record<string, string> = { new: "New", like_new: "Like new", good: "Good", fair: "Fair" };

/** One line of type-specific facts for cards and lists. Never throws on a malformed payload. */
export function summaryLine(type: PostType, payload: unknown): string | null {
  const p = (payload ?? {}) as Record<string, unknown>;
  const s = (k: string) => (typeof p[k] === "string" ? (p[k] as string) : "");
  const n = (k: string) => (typeof p[k] === "number" ? (p[k] as number) : null);
  try {
    switch (type) {
      case "event":
        return [s("startsAt") && formatDateTime(s("startsAt")), s("location")].filter(Boolean).join(" · ") || null;
      case "listing":
        return [formatCents(n("priceCents")), CONDITION[s("condition")] ?? "", s("category")].filter(Boolean).join(" · ");
      case "meal":
        return [s("window"), s("location")].filter(Boolean).join(" · ") || null;
      case "lost":
      case "found":
        return [s("where"), s("when")].filter(Boolean).join(" · ") || null;
      case "ride":
        return [`${s("from")} → ${s("to")}`, s("departsAt") && formatDateTime(s("departsAt")), n("seats") !== null ? `${n("seats")} seat${n("seats") === 1 ? "" : "s"}` : ""].filter(Boolean).join(" · ");
      case "study":
        return [s("course"), s("meets"), s("location")].filter(Boolean).join(" · ") || null;
      case "roommate": {
        const kind = s("kind") === "sublet" ? "Sublet" : s("kind") === "looking" ? "Looking for a place" : "Roommate wanted";
        return [kind, n("rentCents") !== null ? `${formatCents(n("rentCents"))}/mo` : "", s("moveIn") && `from ${s("moveIn")}`, s("location")].filter(Boolean).join(" · ");
      }
      case "poll": {
        const options = Array.isArray(p.options) ? (p.options as unknown[]).length : 0;
        return options ? `${options} options` : null;
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}
