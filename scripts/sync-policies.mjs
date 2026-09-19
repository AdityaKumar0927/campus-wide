/**
 * Records the current policy documents in policy_versions (content hash + date version), so a changed
 * document becomes a new version that required members must accept at their next sign-in.
 *   DB_URL=postgres://... node scripts/sync-policies.mjs
 * Runs against the local stack by default (supabase status). Idempotent: unchanged content is a no-op.
 */
import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";

const url = process.env.DB_URL ?? process.env.DIRECT_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const dir = join(process.cwd(), "content", "policies");
const registry = readFileSync(join(process.cwd(), "src", "lib", "policies", "index.ts"), "utf8");

function meta(slug) {
  const m = registry.match(new RegExp(`slug: "${slug}", title: "([^"]+)", summary: "([^"]+)", required: (true|false)`));
  return m ? { title: m[1], summary: m[2], required: m[3] === "true" } : null;
}

/** TLS everywhere except a loopback database, decided on the parsed host rather than a substring. */
function needsTls(connectionString) {
  try {
    const { hostname } = new URL(connectionString);
    return hostname !== "localhost" && hostname !== "127.0.0.1" && hostname !== "::1";
  } catch {
    return true;
  }
}

const sql = postgres(url, { ssl: needsTls(url) ? "require" : false, max: 1 });
try {
  let changed = 0;
  for (const file of readdirSync(dir).filter((f) => f.endsWith(".mdx")).sort()) {
    const slug = file.replace(/\.mdx$/, "");
    const m = meta(slug);
    if (!m) {
      console.warn(`skip ${slug}: not in the registry`);
      continue;
    }
    const content = readFileSync(join(dir, file), "utf8");
    const hash = createHash("sha256").update(content).digest("hex");
    const [existing] = await sql`select id, content_hash from public.policy_versions where slug = ${slug} and university_id is null order by effective_at desc limit 1`;
    if (existing && existing.content_hash === hash) continue;
    const version = new Date().toISOString().slice(0, 10) + (existing ? "." + Date.now().toString(36).slice(-4) : "");
    await sql`insert into public.policy_versions (slug, version, title, summary, content_path, content_hash, required, effective_at)
      values (${slug}, ${version}, ${m.title}, ${m.summary}, ${"content/policies/" + file}, ${hash}, ${m.required}, now())`;
    changed++;
    console.log(`${existing ? "updated" : "added"} ${slug} -> ${version}`);
  }
  console.log(`policies synced: ${changed} new version(s)`);
} finally {
  await sql.end();
}
