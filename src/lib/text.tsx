import type { ReactNode } from "react";

const URL_RE = /\bhttps?:\/\/[^\s<>"')\]]+[^\s<>"'.,;:!?)\]]/g;

/**
 * Plain text with link detection (PLAN.md Phase 3: Markdown deferred). Only http(s) URLs become
 * links; everything else is rendered as text, so nothing here can inject markup.
 */
export function linkify(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    if (start > last) nodes.push(text.slice(last, start));
    const url = match[0];
    nodes.push(
      <a key={`l${i++}`} href={url} rel="noopener noreferrer nofollow ugc" target="_blank" className="break-all text-primary underline underline-offset-4">
        {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
      </a>,
    );
    last = start + url.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const CHICAGO = "America/Chicago";

/** "2h ago" for the last day, then a short date. Deterministic given `now`, so it is safe on the server. */
export function relativeTime(iso: string, now = new Date()): string {
  const then = new Date(iso);
  const diff = Math.max(0, now.getTime() - then.getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return then.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: CHICAGO, year: then.getFullYear() === now.getFullYear() ? undefined : "numeric" });
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: CHICAGO });
}

export function formatCents(cents: number | null): string {
  if (cents === null) return "Free";
  return (cents / 100).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: cents % 100 === 0 ? 0 : 2 });
}

/** URL-safe slug for spaces. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 60);
}
