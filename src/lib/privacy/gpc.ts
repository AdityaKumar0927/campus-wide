import "server-only";
import { headers } from "next/headers";

/**
 * Global Privacy Control (docs/BRIEF.md §7). A browser sending `Sec-GPC: 1` has opted out of every
 * optional data use: analytics are not loaded, feedback context is not stored, and nothing optional
 * is inferred. Required safety records are unaffected; they are not "sale or sharing".
 */
export async function gpcRequested(): Promise<boolean> {
  const h = await headers();
  return h.get("sec-gpc") === "1";
}
