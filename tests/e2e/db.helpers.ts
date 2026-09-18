import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Service-role access for test setup only (seeding notices for paging). Reads the local Supabase
 * values from .env.local when the shell does not provide them, exactly as `pnpm start` does.
 */
function loadDotEnvLocal() {
  const file = join(process.cwd(), ".env.local");
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    const [, key, raw] = m;
    if (process.env[key] === undefined) process.env[key] = raw.replace(/^"(.*)"$/, "$1");
  }
}
loadDotEnvLocal();

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
export const IIT_ID = "11111111-1111-4111-8111-111111111111";

async function rest(path: string, init: RequestInit) {
  const res = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json", Prefer: "return=representation", ...(init.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

/** Looks up the user id behind a campus username (profiles are readable with the service key). */
export async function userIdFor(uid: string): Promise<string> {
  const rows = (await rest(`profiles?campus_username=eq.${uid}&select=user_id`, { method: "GET" })) as { user_id: string }[];
  if (!rows[0]) throw new Error(`no profile for ${uid}`);
  return rows[0].user_id;
}

/** Seeds plain notices as the service role (no rate limit) so paging can be exercised. */
export async function seedNotices(authorId: string, count: number, prefix: string) {
  const rows = Array.from({ length: count }, (_, i) => ({
    university_id: IIT_ID,
    author_id: authorId,
    type: "notice",
    title: `${prefix} ${String(i + 1).padStart(2, "0")}`,
    body: "Seeded for the paging test.",
    created_at: new Date(Date.now() - (count - i) * 60_000).toISOString(),
  }));
  await rest("posts", { method: "POST", body: JSON.stringify(rows) });
}
