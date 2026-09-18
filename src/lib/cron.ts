import { timingSafeEqual } from "node:crypto";

/** Vercel cron requests carry the project CRON_SECRET as a bearer token; nothing else may call these routes. */
export function cronAuthorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret || !header.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
