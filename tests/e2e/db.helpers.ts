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

/** A notice that expires two seconds from now, so the sweeper has something to take down. */
export async function seedExpiredNotice(authorId: string, title: string): Promise<string> {
  const rows = (await rest("posts", {
    method: "POST",
    body: JSON.stringify([{ university_id: IIT_ID, author_id: authorId, type: "notice", title, body: "Expired on purpose.", expires_at: new Date(Date.now() + 2_000).toISOString() }]),
  })) as { id: string }[];
  return rows[0].id;
}

/** Runs the expiry sweeper the way the cron does. */
export async function runExpirePosts(): Promise<number> {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/run_expire_posts`, {
    method: "POST",
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: "{}",
  });
  if (!res.ok) throw new Error(`run_expire_posts: ${res.status} ${await res.text()}`);
  return (await res.json()) as number;
}

/** Promotes a member the way an admin job would (service role). */
export async function setRole(uid: string, role: "student" | "moderator" | "university_admin") {
  const userId = await userIdFor(uid);
  await rest(`memberships?user_id=eq.${userId}`, { method: "PATCH", body: JSON.stringify({ campus_role: role }) });
  return userId;
}

/** Latest feedback rows, for asserting the popover landed in the database. */
export async function latestFeedback(): Promise<{ sentiment: string; message: string; page_url: string | null }[]> {
  return (await rest("feedback?select=sentiment,message,page_url&order=created_at.desc&limit=5", { method: "GET" })) as { sentiment: string; message: string; page_url: string | null }[];
}

/** Publishes a new required version of a policy, so the re-consent gate has something to ask for. */
export async function bumpPolicy(slug: string, title: string): Promise<string> {
  const version = `e2e-${Date.now()}`;
  await rest("policy_versions", {
    method: "POST",
    body: JSON.stringify([{ slug, version, title, summary: "Changed during a test.", content_path: `content/policies/${slug}.mdx`, content_hash: version, required: true }]),
  });
  return version;
}

/** Removes a test-published policy version again, so later tests are not gated by it. */
export async function dropPolicyVersion(version: string) {
  await fetch(`${supabaseUrl}/rest/v1/policy_versions?version=eq.${encodeURIComponent(version)}`, {
    method: "DELETE",
    headers: { apikey: secretKey, Authorization: `Bearer ${secretKey}` },
  });
}
