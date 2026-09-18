import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, ensureDemoUniversity, setRole, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 3: blocks, spaces, rate limits, moderator removal. */

let a: SupabaseClient;
let aId: string;
let b: SupabaseClient;
let bId: string;
let outsider: SupabaseClient;

async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

beforeAll(async () => {
  await ensureDemoUniversity();
  a = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "sa"));
  aId = (await a.auth.getClaims()).data!.claims.sub;
  await onboard(a, "Sam", "Alpha");
  b = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "sb"));
  bId = (await b.auth.getClaims()).data!.claims.sub;
  await onboard(b, "Bea", "Bravo");
  outsider = await signUpWithOtp(uniqueEmail("demo.campuswide.test", "sdemo"));
  await onboard(outsider, "Dana", "Demo");
}, 120_000);

describe("blocks", () => {
  it("hide both people from each other, then lift", async () => {
    const { data: post } = await b.from("posts").insert({ university_id: IIT_ID, author_id: bId, type: "notice", title: "Free couch in Kacek lounge" }).select("id").single();
    const { error } = await a.from("blocks").insert({ university_id: IIT_ID, blocker_id: aId, blocked_id: bId });
    expect(error).toBeNull();
    const { data: hidden } = await a.from("posts").select("id").eq("id", post!.id);
    expect(hidden).toEqual([]);
    const { data: hiddenProfile } = await b.from("profiles").select("id").eq("user_id", aId);
    expect(hiddenProfile).toEqual([]);
    const { data: others } = await outsider.from("blocks").select("id").eq("blocker_id", aId);
    expect(others).toEqual([]);
    await a.from("blocks").delete().eq("blocked_id", bId);
    const { data: visible } = await a.from("posts").select("id").eq("id", post!.id);
    expect(visible?.length).toBe(1);
  });
});

describe("spaces", () => {
  it("are seeded per campus, joinable, and counted", async () => {
    const { data: space } = await a.from("spaces").select("id, slug, member_count").eq("slug", "first-years").single();
    expect(space).not.toBeNull();
    const { error } = await a.from("space_memberships").insert({ university_id: IIT_ID, space_id: space!.id, user_id: aId });
    expect(error).toBeNull();
    const { data: after } = await a.from("spaces").select("member_count").eq("id", space!.id).single();
    expect(after?.member_count).toBeGreaterThanOrEqual(1);
    const { data: foreign } = await outsider.from("spaces").select("id").eq("slug", "first-years");
    expect(foreign).toEqual([]);
  });

  it("can be created by a member, who becomes able to edit it as organizer", async () => {
    const { data: space, error } = await a.from("spaces").insert({ university_id: IIT_ID, slug: `chem-239-${Date.now()}`, name: "CHEM 239", kind: "course", created_by: aId }).select("id").single();
    expect(error).toBeNull();
    await a.from("space_memberships").insert({ university_id: IIT_ID, space_id: space!.id, user_id: aId, role: "organizer" });
    const { error: editError } = await a.from("spaces").update({ description: "Organic chemistry, section 3" }).eq("id", space!.id);
    expect(editError).toBeNull();
    const { data: edited } = await b.from("spaces").select("description").eq("id", space!.id).single();
    expect(edited?.description).toBe("Organic chemistry, section 3");
  });
});

describe("rate limits", () => {
  it("refuse the fourth post of a new account within an hour", async () => {
    const fresh = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "rlim"));
    await onboard(fresh, "Rae", "Limit");
    const freshId = (await fresh.auth.getClaims()).data!.claims.sub;
    for (let i = 0; i < 3; i++) {
      const { error } = await fresh.from("posts").insert({ university_id: IIT_ID, author_id: freshId, type: "notice", title: `Notice ${i}` });
      expect(error).toBeNull();
    }
    const { error } = await fresh.from("posts").insert({ university_id: IIT_ID, author_id: freshId, type: "notice", title: "One too many" });
    expect(error?.message).toMatch(/rate_limited/);
  });
});

describe("moderators", () => {
  it("can remove a post that members then no longer see", async () => {
    const { data: post } = await a.from("posts").insert({ university_id: IIT_ID, author_id: aId, type: "notice", title: "Selling my meal swipes" }).select("id").single();
    await setRole(bId, "moderator");
    const { error } = await b.from("posts").update({ status: "removed" }).eq("id", post!.id);
    expect(error).toBeNull();
    const { data: modView } = await b.from("posts").select("status").eq("id", post!.id).single();
    expect(modView?.status).toBe("removed");
    const other = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "mmem"));
    await onboard(other, "Mia", "Member");
    const { data: memberView } = await other.from("posts").select("id").eq("id", post!.id);
    expect(memberView).toEqual([]);
    await setRole(bId, "student");
  });
});
