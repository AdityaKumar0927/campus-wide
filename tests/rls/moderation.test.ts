import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, ensureDemoUniversity, serviceClient, setRole, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 5: report, action with a statement of reasons, suspension, appeal by a different moderator. */

let reporter: SupabaseClient;
let subject: SupabaseClient;
let subjectId: string;
let modA: SupabaseClient;
let modAId: string;
let modB: SupabaseClient;
let modBId: string;
let postId: string;
let reportId: string;
let actionId: string;

async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

beforeAll(async () => {
  await ensureDemoUniversity();
  reporter = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "rrep"));
  await onboard(reporter, "Rita", "Reporter");
  subject = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "ssub"));
  subjectId = (await subject.auth.getClaims()).data!.claims.sub;
  await onboard(subject, "Sid", "Subject");
  modA = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "mmoda"));
  modAId = (await modA.auth.getClaims()).data!.claims.sub;
  await onboard(modA, "Mona", "Moderator");
  await setRole(modAId, "moderator");
  modB = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "mmodb"));
  modBId = (await modB.auth.getClaims()).data!.claims.sub;
  await onboard(modB, "Max", "Moderator");
  await setRole(modBId, "moderator");
  const { data } = await subject.from("posts").insert({ university_id: IIT_ID, author_id: subjectId, type: "notice", title: "Selling my meal swipes, DM me", body: "Zelle only." }).select("id").single();
  postId = data!.id;
}, 180_000);

describe("reports", () => {
  it("snapshot the evidence, get a case number, and reach every moderator", async () => {
    const { data: caseNumber, error } = await reporter.rpc("file_report", { p_target_type: "post", p_target_id: postId, p_category: "meal_resale", p_note: "This is resale." });
    expect(error).toBeNull();
    expect(caseNumber).toMatch(/^CW-[A-F0-9]{6}$/);
    const { data: mine } = await reporter.from("reports").select("id, status, evidence, subject_id").eq("case_number", caseNumber!).single();
    expect(mine).toMatchObject({ status: "open", subject_id: subjectId });
    expect((mine!.evidence as { post: { title: string } }).post.title).toBe("Selling my meal swipes, DM me");
    reportId = mine!.id;
    const { data: hidden } = await subject.from("reports").select("id").eq("id", reportId);
    expect(hidden).toEqual([]);
    const { data: modInbox } = await modA.from("notifications").select("title").eq("target_id", reportId);
    expect(modInbox?.[0]?.title).toContain(caseNumber);
    const { error: self } = await subject.rpc("file_report", { p_target_type: "post", p_target_id: postId, p_category: "spam" });
    expect(self?.message).toMatch(/yourself/);
  });
});

describe("moderation", () => {
  it("refuses members and requires a statement of reasons", async () => {
    const { error: member } = await reporter.rpc("moderate", { p_report_id: reportId, p_target_type: "post", p_target_id: postId, p_subject: subjectId, p_kind: "remove", p_facts: "Resale of meal credits in the title.", p_ground: "Meal sharing policy 2" });
    expect(member?.message).toMatch(/moderators only/);
    const { error: noReasons } = await modA.rpc("moderate", { p_report_id: reportId, p_target_type: "post", p_target_id: postId, p_subject: subjectId, p_kind: "remove", p_facts: "no", p_ground: "" });
    expect(noReasons?.message).toMatch(/statement of reasons/);
  });

  it("removes the notice, records the statement, and tells the subject", async () => {
    const { data, error } = await modA.rpc("moderate", { p_report_id: reportId, p_target_type: "post", p_target_id: postId, p_subject: subjectId, p_kind: "remove", p_facts: "The title offers meal swipes for money.", p_ground: "Meal sharing policy, section 2: nothing is sold." });
    expect(error).toBeNull();
    actionId = data!;
    const { data: post } = await modA.from("posts").select("status").eq("id", postId).single();
    expect(post?.status).toBe("removed");
    const { data: gone } = await reporter.from("posts").select("id").eq("id", postId);
    expect(gone).toEqual([]);
    const { data: report } = await reporter.from("reports").select("status").eq("id", reportId).single();
    expect(report?.status).toBe("actioned");
    const { data: action } = await subject.from("moderation_actions").select("kind, statement_of_reasons").eq("id", actionId).single();
    expect(action?.kind).toBe("remove");
    expect((action?.statement_of_reasons as { automated: boolean }).automated).toBe(false);
    const { data: inbox } = await subject.from("notifications").select("title, href").eq("target_id", actionId);
    expect(inbox?.[0]).toMatchObject({ title: "A notice of yours was removed", href: `/appeals/${actionId}` });
  });

  it("suspends, and the suspended member can no longer post", async () => {
    const { error } = await modA.rpc("moderate", { p_report_id: null, p_target_type: "profile", p_target_id: subjectId, p_subject: subjectId, p_kind: "suspend", p_facts: "Second resale attempt this week.", p_ground: "Community guidelines 4", p_days: 3 });
    expect(error).toBeNull();
    const { data: m } = await serviceClient().from("memberships").select("status, suspended_until").eq("user_id", subjectId).single();
    expect(m?.status).toBe("suspended");
    expect(m?.suspended_until).not.toBeNull();
    const { error: blocked } = await subject.from("posts").insert({ university_id: IIT_ID, author_id: subjectId, type: "notice", title: "Still here" });
    expect(blocked).not.toBeNull();
    await serviceClient().from("memberships").update({ status: "active", suspended_until: null }).eq("user_id", subjectId);
  });
});

describe("appeals", () => {
  it("are filed once by the subject and decided by a different moderator", async () => {
    const { error: notMine } = await reporter.rpc("appeal", { p_action_id: actionId, p_text: "I object to this decision entirely." });
    expect(notMine?.message).toMatch(/not your decision/);
    const { data: appealId, error } = await subject.rpc("appeal", { p_action_id: actionId, p_text: "The notice was a joke between friends; nothing was sold." });
    expect(error).toBeNull();
    const { error: twice } = await subject.rpc("appeal", { p_action_id: actionId, p_text: "Trying again just in case this works." });
    expect(twice).not.toBeNull();
    const { error: same } = await modA.rpc("decide_appeal", { p_appeal_id: appealId!, p_outcome: "overturned", p_reasons: "On reflection the notice was a joke." });
    expect(same?.message).toMatch(/different moderator/);
    const { error: decided } = await modB.rpc("decide_appeal", { p_appeal_id: appealId!, p_outcome: "overturned", p_reasons: "Context shows a joke between friends; restored with a warning." });
    expect(decided).toBeNull();
    const { data: post } = await reporter.from("posts").select("status").eq("id", postId).single();
    expect(post?.status).toBe("active");
    const { data: action } = await subject.from("moderation_actions").select("reversed_at").eq("id", actionId).single();
    expect(action?.reversed_at).not.toBeNull();
    const { data: inbox } = await subject.from("notifications").select("title").eq("target_id", appealId!);
    expect(inbox?.[0]?.title).toBe("Your appeal succeeded");
  });
});
