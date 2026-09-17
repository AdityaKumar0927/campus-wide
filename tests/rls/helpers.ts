import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Helpers for tests that run against the local Supabase stack (`supabase start`).
 * Sign-ups go through the real OTP flow so the Before User Created hook and the identity trigger run.
 */

export const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "";
export const secretKey = process.env.SUPABASE_SECRET_KEY ?? "";
const mailpit = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export const IIT_ID = "11111111-1111-4111-8111-111111111111";
export const DEMO_ID = "22222222-2222-4222-8222-222222222222";

export function anonClient(): SupabaseClient {
  return createClient(url, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function serviceClient(): SupabaseClient {
  return createClient(url, secretKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function uniqueEmail(domain: string, prefix = "t") {
  return `${prefix}${randomUUID().replace(/-/g, "").slice(0, 10)}@${domain}`;
}

interface MailpitMessage { ID: string; To: { Address: string }[]; Created: string }

/** Reads the newest OTP code Mailpit received for an address. */
export async function readOtpCode(email: string, attempts = 20): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=5`);
    const json = (await res.json()) as { messages: MailpitMessage[] };
    const msg = json.messages?.find((m) => m.To.some((t) => t.Address.toLowerCase() === email.toLowerCase()));
    if (msg) {
      const body = (await (await fetch(`${mailpit}/api/v1/message/${msg.ID}`)).json()) as { Text: string; HTML: string };
      const m = (body.Text || body.HTML).match(/\b(\d{6})\b/);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no OTP email for ${email}`);
}

/** Full sign-up: request a code, read it from Mailpit, verify it. Returns a signed-in client. */
export async function signUpWithOtp(email: string): Promise<SupabaseClient> {
  const client = anonClient();
  const { error } = await client.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
  const token = await readOtpCode(email);
  const { error: verifyError } = await client.auth.verifyOtp({ email, token, type: "email" });
  if (verifyError) throw verifyError;
  return client;
}

/** Ensures a second, non-Illinois-Tech tenant exists for isolation tests. */
export async function ensureDemoUniversity() {
  const admin = serviceClient();
  await admin.from("universities").upsert(
    { id: DEMO_ID, slug: "demo-university", name: "Demo University", short_name: "Demo", status: "active", country: "US" },
    { onConflict: "slug" },
  );
  await admin.from("university_domains").upsert(
    { university_id: DEMO_ID, domain: "demo.campuswide.test", role: "student", verified: true, source: "seed" },
    { onConflict: "domain" },
  );
}

/** Promotes a user to a campus role via the service role (as an admin job would). */
export async function setRole(userId: string, role: "student" | "moderator" | "university_admin") {
  const { error } = await serviceClient().from("memberships").update({ campus_role: role }).eq("user_id", userId);
  if (error) throw error;
}
