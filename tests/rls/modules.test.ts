import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, ensureDemoUniversity, serviceClient, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 4: participants, polls, meal audience, feature flags. */

let host: SupabaseClient;
let hostId: string;
let guest: SupabaseClient;
let guestId: string;
let third: SupabaseClient;

async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

async function post(client: SupabaseClient, authorId: string, row: Record<string, unknown>) {
  const { data, error } = await client.from("posts").insert({ university_id: IIT_ID, author_id: authorId, ...row }).select("id").single();
  if (error) throw error;
  return data!.id as string;
}

/** Same rule as app.current_term(): fall from August, summer from June, otherwise spring. */
function currentTerm() {
  const chicago = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Chicago" }));
  const m = chicago.getMonth() + 1;
  return `${chicago.getFullYear()}-${m >= 8 ? "fall" : m >= 6 ? "summer" : "spring"}`;
}

beforeAll(async () => {
  await ensureDemoUniversity();
  host = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "mhost"));
  hostId = (await host.auth.getClaims()).data!.claims.sub;
  await onboard(host, "Hana", "Host");
  guest = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "mguest"));
  guestId = (await guest.auth.getClaims()).data!.claims.sub;
  await onboard(guest, "Gus", "Guest");
  third = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "mthird"));
  await onboard(third, "Tia", "Third");
}, 120_000);

describe("participants", () => {
  it("fill a ride up to its seats and tell the driver", async () => {
    const departs = new Date(Date.now() + 86_400_000).toISOString();
    const rideId = await post(host, hostId, { type: "ride", title: "Two seats to the airport", payload: { from: "Rowe Village", to: "ORD", departsAt: departs, seats: 1, costSplit: true } });
    const { data: ride } = await host.from("posts").select("expires_at").eq("id", rideId).single();
    expect(ride?.expires_at).not.toBeNull();
    const { error: hostErr } = await host.from("post_participants").insert({ university_id: IIT_ID, post_id: rideId, user_id: hostId, kind: "rsvp" });
    expect(hostErr?.message).toMatch(/host/);
    const { data: seat, error } = await guest.from("post_participants").insert({ university_id: IIT_ID, post_id: rideId, user_id: hostId, kind: "rsvp" }).select("kind, user_id").single();
    expect(error).toBeNull();
    expect(seat).toMatchObject({ kind: "seat", user_id: guestId });
    const { error: full } = await third.from("post_participants").insert({ university_id: IIT_ID, post_id: rideId, user_id: guestId, kind: "seat" });
    expect(full?.message).toMatch(/full/);
    const { data: inbox } = await host.from("notifications").select("title").eq("target_id", rideId);
    expect(inbox?.[0]?.title).toMatch(/took a seat/);
  });
});

describe("polls", () => {
  it("count one vote per student and keep ballots private", async () => {
    const pollId = await post(host, hostId, { type: "poll", title: "Best late-night food?", payload: { options: ["Bog tots", "Jerk chicken", "Global Grounds"], multiple: false } });
    expect((await guest.rpc("cast_poll_vote", { p_post_id: pollId, p_options: [1] })).error).toBeNull();
    expect((await third.rpc("cast_poll_vote", { p_post_id: pollId, p_options: [1] })).error).toBeNull();
    expect((await guest.rpc("cast_poll_vote", { p_post_id: pollId, p_options: [0] })).error).toBeNull();
    const { error: two } = await third.rpc("cast_poll_vote", { p_post_id: pollId, p_options: [0, 1] });
    expect(two?.message).toMatch(/pick one/);
    const { error: range } = await third.rpc("cast_poll_vote", { p_post_id: pollId, p_options: [7] });
    expect(range?.message).toMatch(/range/);
    const { data: results } = await host.rpc("poll_results", { p_post_id: pollId });
    expect(results).toEqual([
      { option_index: 0, votes: 1 },
      { option_index: 1, votes: 1 },
    ]);
    const { data: ballots } = await host.from("poll_votes").select("user_id").eq("post_id", pollId);
    expect(ballots).toEqual([]);
  });
});

describe("meal audience and feature flags", () => {
  it("is switched off by default; requests are visible to attested holders only", async () => {
    const mealPayload = { kind: "guest_meal_treat", location: "The Commons", window: "Thursday dinner" };
    const { error: off } = await host.from("posts").insert({ university_id: IIT_ID, author_id: hostId, type: "meal", title: "Guest meal tonight", payload: mealPayload });
    expect(off?.message).toMatch(/switched off/);
    const admin = serviceClient();
    const { data: uni } = await admin.from("universities").select("feature_flags").eq("id", IIT_ID).single();
    const flags = uni!.feature_flags as Record<string, boolean>;
    await admin.from("universities").update({ feature_flags: { ...flags, meals: true } }).eq("id", IIT_ID);
    try {
      const requestId = await post(host, hostId, { type: "meal", title: "A student needs dinner Thursday", audience: "meal_holders", payload: mealPayload });
      const { data: notHolder } = await guest.from("posts").select("id").eq("id", requestId);
      expect(notHolder).toEqual([]);
      await admin.from("profiles").update({ meal_plan_attested_term: currentTerm() }).eq("user_id", guestId);
      const { data: holder } = await guest.from("posts").select("id").eq("id", requestId);
      expect(holder?.length).toBe(1);
    } finally {
      await admin.from("universities").update({ feature_flags: flags }).eq("id", IIT_ID);
    }
  });
});
