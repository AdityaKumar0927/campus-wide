import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, ensureDemoUniversity, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 3: posts, answers, accepted answers, thanks, notifications. */

let asker: SupabaseClient;
let askerId: string;
let helper: SupabaseClient;
let helperId: string;
let outsider: SupabaseClient;
let unnamed: SupabaseClient;

export async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

beforeAll(async () => {
  await ensureDemoUniversity();
  asker = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "aask"));
  askerId = (await asker.auth.getClaims()).data!.claims.sub;
  await onboard(asker, "Ava", "Askew");
  helper = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "hhelp"));
  helperId = (await helper.auth.getClaims()).data!.claims.sub;
  await onboard(helper, "Hank", "Helper");
  outsider = await signUpWithOtp(uniqueEmail("demo.campuswide.test", "demo"));
  await onboard(outsider, "Dana", "Demo");
  unnamed = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "nnew"));
}, 120_000);

describe("posts", () => {
  let postId: string;
  let answerId: string;

  it("cannot be created before the name is declared", async () => {
    const { error } = await unnamed.from("posts").insert({ university_id: IIT_ID, author_id: "00000000-0000-4000-8000-000000000000", type: "question", title: "Too early" });
    expect(error).not.toBeNull();
  });

  it("get identity and counters from the database, not the client", async () => {
    const { data, error } = await asker
      .from("posts")
      .insert({ university_id: IIT_ID, author_id: helperId, type: "question", title: "Does the 2am shuttle run during reading week?", body: "Asking for a friend.", thanks_count: 99, comment_count: 5, status: "resolved" })
      .select("id, author_id, thanks_count, comment_count, status")
      .single();
    expect(error).toBeNull();
    expect(data).toMatchObject({ author_id: askerId, thanks_count: 0, comment_count: 0, status: "active" });
    postId = data!.id;
  });

  it("are invisible to another campus", async () => {
    const { data } = await outsider.from("posts").select("id").eq("id", postId);
    expect(data).toEqual([]);
  });

  it("show up in full-text search for campus members only", async () => {
    const { data } = await helper.rpc("search_posts", { q: "shuttle reading week" });
    expect(data?.map((p: { id: string }) => p.id)).toContain(postId);
    const { data: none } = await outsider.rpc("search_posts", { q: "shuttle reading week" });
    expect(none).toEqual([]);
  });

  it("keep counters and author fixed when the owner edits", async () => {
    await asker.from("posts").update({ thanks_count: 50, author_id: helperId, title: "Edited title" }).eq("id", postId);
    const { data } = await asker.from("posts").select("thanks_count, author_id, title").eq("id", postId).single();
    expect(data).toMatchObject({ thanks_count: 0, author_id: askerId, title: "Edited title" });
  });

  it("cannot be removed by another member", async () => {
    await helper.from("posts").update({ status: "removed" }).eq("id", postId);
    const { data: still } = await helper.from("posts").select("status").eq("id", postId).single();
    expect(still?.status).toBe("active");
  });

  it("an answer bumps the count and notifies the asker only", async () => {
    const { data, error } = await helper.from("comments").insert({ university_id: IIT_ID, post_id: postId, author_id: askerId, body: "Only the 10pm and midnight runs." }).select("id, author_id").single();
    expect(error).toBeNull();
    expect(data!.author_id).toBe(helperId);
    answerId = data!.id;
    const { data: post } = await asker.from("posts").select("comment_count").eq("id", postId).single();
    expect(post?.comment_count).toBe(1);
    const { data: inbox } = await asker.from("notifications").select("kind, actor_id").eq("target_id", postId);
    expect(inbox?.[0]).toMatchObject({ kind: "answer", actor_id: helperId });
    const { data: helpersInbox } = await helper.from("notifications").select("id").eq("target_id", postId);
    expect(helpersInbox).toEqual([]);
  });

  it("only the asker can accept, and accepting counts as helped", async () => {
    const { error: notMine } = await helper.rpc("accept_answer", { p_comment_id: answerId });
    expect(notMine).not.toBeNull();
    const { error } = await asker.rpc("accept_answer", { p_comment_id: answerId });
    expect(error).toBeNull();
    const { data: post } = await asker.from("posts").select("status, accepted_comment_id").eq("id", postId).single();
    expect(post).toMatchObject({ status: "resolved", accepted_comment_id: answerId });
    const { data: profile } = await helper.from("profiles").select("helped_count").eq("user_id", helperId).single();
    expect(profile?.helped_count).toBe(1);
    const { data: inbox } = await helper.from("notifications").select("kind").eq("kind", "accepted");
    expect(inbox?.length).toBe(1);
  });

  it("thanks toggle on and off and roll up to the profile", async () => {
    const { data: added } = await asker.rpc("toggle_thanks", { p_target_type: "comment", p_target_id: answerId });
    expect(added).toBe(true);
    const { data: c } = await asker.from("comments").select("thanks_count").eq("id", answerId).single();
    expect(c?.thanks_count).toBe(1);
    const { data: p } = await asker.from("profiles").select("thanks_count").eq("user_id", helperId).single();
    expect(p?.thanks_count).toBe(1);
    const { data: removed } = await asker.rpc("toggle_thanks", { p_target_type: "comment", p_target_id: answerId });
    expect(removed).toBe(false);
    const { data: c2 } = await asker.from("comments").select("thanks_count").eq("id", answerId).single();
    expect(c2?.thanks_count).toBe(0);
  });

  it("a notification can be marked read but not rewritten or forged", async () => {
    const { data: n } = await asker.from("notifications").select("id, title").eq("target_id", postId).single();
    await asker.from("notifications").update({ read_at: new Date().toISOString(), title: "forged" }).eq("id", n!.id);
    const { data: after } = await asker.from("notifications").select("read_at, title").eq("id", n!.id).single();
    expect(after?.read_at).not.toBeNull();
    expect(after?.title).toBe(n!.title);
    const { data: forged } = await asker.from("notifications").insert({ university_id: IIT_ID, user_id: helperId, kind: "system", title: "spam" }).select();
    expect(forged).toBeNull();
  });
});
