import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, ensureDemoUniversity, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 4: the masked relay. Addresses never leave the database until both sides agree. */

let seller: SupabaseClient;
let sellerId: string;
let buyer: SupabaseClient;
let buyerId: string;
let bystander: SupabaseClient;
let listingId: string;
let threadId: string;

async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

beforeAll(async () => {
  await ensureDemoUniversity();
  seller = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "rsell"));
  sellerId = (await seller.auth.getClaims()).data!.claims.sub;
  await onboard(seller, "Sara", "Seller");
  buyer = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "rbuy"));
  buyerId = (await buyer.auth.getClaims()).data!.claims.sub;
  await onboard(buyer, "Ben", "Buyer");
  bystander = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "rby"));
  await onboard(bystander, "Bea", "Bystander");
  const { data } = await seller.from("posts").insert({ university_id: IIT_ID, author_id: sellerId, type: "listing", title: "Commuter bike, new brakes", payload: { priceCents: 6000, condition: "good", category: "bikes" } }).select("id").single();
  listingId = data!.id;
}, 120_000);

describe("relay threads", () => {
  it("open from a listing, never from a question, and stay private", async () => {
    const { data: q } = await seller.from("posts").insert({ university_id: IIT_ID, author_id: sellerId, type: "question", title: "Where is the good printer?" }).select("id").single();
    const { error: noTabs } = await buyer.from("relay_threads").insert({ university_id: IIT_ID, post_id: q!.id, initiator_id: buyerId, owner_id: buyerId });
    expect(noTabs?.message).toMatch(/no contact tabs/);
    const { data, error } = await buyer.from("relay_threads").insert({ university_id: IIT_ID, post_id: listingId, initiator_id: buyerId, owner_id: buyerId, owner_share_email: true }).select("id, owner_id, owner_share_email, state").single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ owner_id: sellerId, owner_share_email: false, state: "open" });
    threadId = data!.id;
    const { data: hidden } = await bystander.from("relay_threads").select("id").eq("id", threadId);
    expect(hidden).toEqual([]);
  });

  it("deliver one opening message, then wait for a reply, and flag payment words", async () => {
    const { error } = await buyer.from("relay_messages").insert({ university_id: IIT_ID, thread_id: threadId, sender_id: buyerId, body: "Is the bike still available? I can do Thursday." });
    expect(error).toBeNull();
    const { error: second } = await buyer.from("relay_messages").insert({ university_id: IIT_ID, thread_id: threadId, sender_id: buyerId, body: "Hello??" });
    expect(second?.message).toMatch(/wait_for_reply/);
    const { data: inbox } = await seller.from("notifications").select("kind, href").eq("kind", "relay");
    expect(inbox?.[0]?.href).toBe(`/t/${threadId}`);
    const { error: reply } = await seller.from("relay_messages").insert({ university_id: IIT_ID, thread_id: threadId, sender_id: sellerId, body: "Yes. Library front desk at four? Zelle works too." });
    expect(reply).toBeNull();
    const { data: thread } = await seller.from("relay_threads").select("message_count, flagged").eq("id", threadId).single();
    expect(thread).toMatchObject({ message_count: 2, flagged: true });
    const { error: third } = await buyer.from("relay_messages").insert({ university_id: IIT_ID, thread_id: threadId, sender_id: buyerId, body: "No Zelle. Cash in person, thanks." });
    expect(third).toBeNull();
  });

  it("reveal an address only when both sides opt in, and export for a report", async () => {
    const { data: before } = await buyer.rpc("relay_contact", { p_thread_id: threadId });
    expect(before?.[0]?.email).toBeNull();
    expect(before?.[0]?.display_name).toBe("Sara S.");
    await buyer.from("relay_threads").update({ initiator_share_email: true, owner_share_email: true }).eq("id", threadId);
    const { data: half } = await buyer.rpc("relay_contact", { p_thread_id: threadId });
    expect(half?.[0]?.email).toBeNull();
    await seller.from("relay_threads").update({ owner_share_email: true }).eq("id", threadId);
    const { data: both } = await buyer.rpc("relay_contact", { p_thread_id: threadId });
    expect(both?.[0]?.email).toMatch(/@hawk\.illinoistech\.edu$/);
    const { data: exported } = await seller.rpc("export_relay_thread", { p_thread_id: threadId });
    expect((exported as { messages: unknown[] }).messages.length).toBe(3);
    const { data: none } = await bystander.rpc("export_relay_thread", { p_thread_id: threadId });
    expect(none).toBeNull();
  });

  it("freeze when one side blocks the other", async () => {
    await seller.from("blocks").insert({ university_id: IIT_ID, blocker_id: sellerId, blocked_id: buyerId });
    const { error } = await buyer.from("relay_messages").insert({ university_id: IIT_ID, thread_id: threadId, sender_id: buyerId, body: "Still there?" });
    expect(error?.message).toMatch(/closed/);
    await seller.from("blocks").delete().eq("blocked_id", buyerId);
  });

  it("credit the owner once both confirm it happened", async () => {
    await buyer.from("relay_threads").update({ initiator_confirmed_at: new Date().toISOString() }).eq("id", threadId);
    await seller.from("relay_threads").update({ owner_confirmed_at: new Date().toISOString() }).eq("id", threadId);
    const { data: thread } = await seller.from("relay_threads").select("state").eq("id", threadId).single();
    expect(thread?.state).toBe("completed");
    const { data: profile } = await buyer.from("profiles").select("helped_count").eq("user_id", sellerId).single();
    expect(profile?.helped_count).toBe(1);
  });
});
