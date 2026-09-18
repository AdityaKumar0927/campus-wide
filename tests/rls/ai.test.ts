import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { IIT_ID, ensureDemoUniversity, signUpWithOtp, uniqueEmail } from "./helpers";

/** Phase 6: embeddings stay inside the campus; matching finds the nearest question. */

let me: SupabaseClient;
let meId: string;
let outsider: SupabaseClient;

async function onboard(client: SupabaseClient, given: string, family: string) {
  const { error } = await client.rpc("declare_name", { given, family, age_attested: true });
  if (error) throw error;
}

/** A deterministic unit vector pointing mostly along one axis, so cosine similarity is predictable. */
function axisVector(axis: number, spread = 0.05): number[] {
  const v = Array.from({ length: 384 }, (_, i) => (i === axis ? 1 : spread * Math.sin(i + axis)));
  const norm = Math.hypot(...v);
  return v.map((x) => x / norm);
}

beforeAll(async () => {
  await ensureDemoUniversity();
  me = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "aiq"));
  meId = (await me.auth.getClaims()).data!.claims.sub;
  await onboard(me, "Ann", "Asker");
  outsider = await signUpWithOtp(uniqueEmail("demo.campuswide.test", "aidemo"));
  await onboard(outsider, "Dana", "Demo");
}, 120_000);

describe("match_questions", () => {
  it("returns the nearest questions on my campus and nothing across campuses", async () => {
    const near = axisVector(1);
    const far = axisVector(200);
    const { data: q1, error } = await me.from("posts").insert({ university_id: IIT_ID, author_id: meId, type: "question", title: "Does the 2am shuttle run during reading week?", embedding: JSON.stringify(near) }).select("id").single();
    expect(error).toBeNull();
    await me.from("posts").insert({ university_id: IIT_ID, author_id: meId, type: "question", title: "Where can I print a poster?", embedding: JSON.stringify(far) });
    const { data: matches } = await me.rpc("match_questions", { p_embedding: JSON.stringify(axisVector(1, 0.06)), p_limit: 3 });
    expect(matches?.[0]?.id).toBe(q1!.id);
    expect(matches?.[0]?.similarity).toBeGreaterThan(0.9);
    const { data: none } = await outsider.rpc("match_questions", { p_embedding: JSON.stringify(near), p_limit: 3 });
    expect(none).toEqual([]);
  });

  it("rejects a vector of the wrong size", async () => {
    const { error } = await me.rpc("match_questions", { p_embedding: JSON.stringify([0.1, 0.2]), p_limit: 3 });
    expect(error).not.toBeNull();
  });
});
