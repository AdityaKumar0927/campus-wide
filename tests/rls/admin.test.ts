import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, anonClient, ensureDemoUniversity, setRole, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 5: admin flags, aggregate stats, public campus numbers, feedback. */

let member: SupabaseClient;
let memberId: string;
let admin: SupabaseClient;
let adminId: string;

async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

beforeAll(async () => {
  await ensureDemoUniversity();
  member = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "amem"));
  memberId = (await member.auth.getClaims()).data!.claims.sub;
  await onboard(member, "Amy", "Member");
  admin = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "aadm"));
  adminId = (await admin.auth.getClaims()).data!.claims.sub;
  await onboard(admin, "Ada", "Admin");
  await setRole(adminId, "university_admin");
}, 120_000);

describe("admin", () => {
  it("toggles a module for the whole campus and reads counts only", async () => {
    const { data: before } = await admin.from("universities").select("feature_flags").eq("id", IIT_ID).single();
    const flags = before!.feature_flags as Record<string, boolean>;
    const { error } = await admin.from("universities").update({ feature_flags: { ...flags, polls: false } }).eq("id", IIT_ID);
    expect(error).toBeNull();
    try {
      const { error: pollOff } = await member.from("posts").insert({ university_id: IIT_ID, author_id: memberId, type: "poll", title: "Poll while off", payload: { options: ["a", "b"], multiple: false } });
      expect(pollOff?.message).toMatch(/switched off/);
    } finally {
      await admin.from("universities").update({ feature_flags: flags }).eq("id", IIT_ID);
    }
    const { data: stats } = await admin.rpc("admin_campus_stats");
    expect(stats).toHaveProperty("members");
    expect(JSON.stringify(stats)).not.toContain("@");
    const { error: notAdmin } = await member.rpc("admin_campus_stats");
    expect(notAdmin?.message).toMatch(/admins only/);
    await member.from("universities").update({ feature_flags: { ...flags, polls: false } }).eq("id", IIT_ID);
    const { data: after } = await member.from("universities").select("feature_flags").eq("id", IIT_ID).single();
    expect((after!.feature_flags as Record<string, boolean>).polls).toBe(true);
  });

  it("promotes a moderator by membership update", async () => {
    const { error } = await admin.from("memberships").update({ campus_role: "moderator" }).eq("user_id", memberId);
    expect(error).toBeNull();
    const { data } = await member.from("memberships").select("campus_role").eq("user_id", memberId).single();
    expect(data?.campus_role).toBe("moderator");
    await setRole(memberId, "student");
  });
});

describe("public campus numbers", () => {
  it("are readable by anyone and hide small groups", async () => {
    const { data } = await anonClient().rpc("public_campus_stats", { p_slug: "illinois-tech" });
    expect(data).toMatchObject({ slug: "illinois-tech", short_name: "Illinois Tech" });
    const members = (data as { members: number | null }).members;
    expect(members === null || members % 10 === 0).toBe(true);
    const { data: none } = await anonClient().rpc("public_campus_stats", { p_slug: "nowhere" });
    expect(none).toBeNull();
  });
});

describe("feedback", () => {
  it("is stored for members and anonymous visitors alike, never forged", async () => {
    const { error } = await member.from("feedback").insert({ university_id: IIT_ID, user_id: memberId, sentiment: "love", message: "The bottom nav is lovely on a phone.", consent: true, page_url: "/feed" });
    expect(error).toBeNull();
    const { error: anon } = await anonClient().from("feedback").insert({ sentiment: "meh", message: "Where is the dark mode toggle?", consent: false });
    expect(anon).toBeNull();
    const { error: forged } = await member.from("feedback").insert({ user_id: adminId, sentiment: "bad", message: "Forged" });
    expect(forged).not.toBeNull();
    const { data: visible } = await admin.from("feedback").select("sentiment").eq("university_id", IIT_ID);
    expect(visible?.length).toBeGreaterThan(0);
  });
});
