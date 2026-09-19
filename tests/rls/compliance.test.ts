import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, ensureDemoUniversity, serviceClient, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 7: re-consent, push subscriptions, account deletion and the purge. */

let me: SupabaseClient;
let meId: string;
let other: SupabaseClient;
let otherId: string;

async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

/** Accepts every required policy the way onboarding does. */
async function acceptAll(client: SupabaseClient, userId: string) {
  const { data } = await client.rpc("pending_consents");
  const rows = (data ?? []).map((p: { id: string }) => ({ user_id: userId, policy_version_id: p.id, choice: "accept", accepted: true }));
  if (rows.length > 0) {
    const { error } = await client.from("consent_records").insert(rows);
    if (error) throw error;
  }
}

beforeAll(async () => {
  await ensureDemoUniversity();
  me = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "cme"));
  meId = (await me.auth.getClaims()).data!.claims.sub;
  await onboard(me, "Cara", "Compliant");
  other = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "coth"));
  otherId = (await other.auth.getClaims()).data!.claims.sub;
  await onboard(other, "Otto", "Other");
}, 120_000);

describe("re-consent", () => {
  it("lists the required policies until they are accepted, then nothing", async () => {
    const { data: before } = await me.rpc("pending_consents");
    expect((before ?? []).some((p: { slug: string }) => p.slug === "safety-rules")).toBe(true);
    await acceptAll(me, meId);
    const { data: after } = await me.rpc("pending_consents");
    expect(after).toEqual([]);
  });

  it("asks again when a new version of a required policy appears", async () => {
    const admin = serviceClient();
    const version = `test-${Date.now()}`;
    await admin.from("policy_versions").insert({ slug: "terms", version, title: "Terms of Service", summary: "Changed for the test.", content_path: "content/policies/terms.mdx", content_hash: version, required: true });
    const { data: pending } = await me.rpc("pending_consents");
    expect((pending ?? []).some((p: { version: string }) => p.version === version)).toBe(true);
    await acceptAll(me, meId);
    const { data: cleared } = await me.rpc("pending_consents");
    expect(cleared).toEqual([]);
  });
});

describe("push subscriptions", () => {
  it("belong to their owner alone", async () => {
    const endpoint = `https://push.example.test/${Date.now()}`;
    const { error } = await me.from("push_subscriptions").insert({ user_id: meId, endpoint, p256dh: "key", auth: "auth" });
    expect(error).toBeNull();
    const { data: mine } = await me.from("push_subscriptions").select("endpoint");
    expect(mine?.some((s) => s.endpoint === endpoint)).toBe(true);
    const { data: theirs } = await other.from("push_subscriptions").select("endpoint").eq("endpoint", endpoint);
    expect(theirs).toEqual([]);
    const { error: forged } = await other.from("push_subscriptions").insert({ user_id: meId, endpoint: `${endpoint}-forged`, p256dh: "k", auth: "a" });
    expect(forged).not.toBeNull();
  });
});

describe("account deletion", () => {
  it("schedules, can be cancelled, and purges identity while anonymising content", async () => {
    const { data: post } = await other.from("posts").insert({ university_id: IIT_ID, author_id: otherId, type: "notice", title: "A notice by someone leaving" }).select("id").single();

    const { data: scheduled, error } = await other.rpc("request_account_deletion");
    expect(error).toBeNull();
    expect(new Date(scheduled!).getTime()).toBeGreaterThan(Date.now());
    const { data: membership } = await serviceClient().from("memberships").select("status").eq("user_id", otherId).single();
    expect(membership?.status).toBe("suspended");

    const { error: cancelled } = await other.rpc("cancel_account_deletion");
    expect(cancelled).toBeNull();
    const { data: restored } = await serviceClient().from("memberships").select("status").eq("user_id", otherId).single();
    expect(restored?.status).toBe("active");

    // Request again, then bring the schedule forward and run the purge as the maintenance job does.
    await other.rpc("request_account_deletion");
    const admin = serviceClient();
    await admin.from("deletion_requests").update({ scheduled_for: new Date(Date.now() - 1000).toISOString() }).eq("user_id", otherId);
    const { data: maintenance, error: purgeError } = await admin.rpc("run_maintenance");
    expect(purgeError).toBeNull();
    expect(JSON.stringify(maintenance)).toContain(otherId);

    const { data: anonymised } = await me.from("posts").select("author_id, title").eq("id", post!.id).single();
    expect(anonymised).toMatchObject({ author_id: null, title: "A notice by someone leaving" });
    const { data: profile } = await admin.from("profiles").select("display_name, campus_username, privacy_mode").eq("user_id", otherId).single();
    expect(profile?.display_name).toBe("Former member");
    expect(profile?.campus_username).toMatch(/^deleted-/);
    const { data: user } = await admin.from("users").select("email, declared_given_name").eq("id", otherId).single();
    expect(user?.email).toMatch(/@invalid\.campus-wide$/);
    expect(user?.declared_given_name).toBeNull();
  });
});
