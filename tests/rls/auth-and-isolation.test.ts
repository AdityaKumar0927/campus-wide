import { beforeAll, describe, expect, it } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { DEMO_ID, IIT_ID, anonClient, ensureDemoUniversity, serviceClient, setRole, signUpWithOtp, uniqueEmail } from "./helpers";

let iitUser: SupabaseClient;
let iitUserId: string;
let demoUser: SupabaseClient;
let demoUserId: string;

beforeAll(async () => {
  await ensureDemoUniversity();
  iitUser = await signUpWithOtp(uniqueEmail("hawk.illinoistech.edu", "jdoe"));
  iitUserId = (await iitUser.auth.getClaims()).data!.claims.sub;
  demoUser = await signUpWithOtp(uniqueEmail("demo.campuswide.test", "demo"));
  demoUserId = (await demoUser.auth.getClaims()).data!.claims.sub;
});

describe("sign-up gates", () => {
  it("rejects a non-campus address at the database (Before User Created hook)", async () => {
    const { error } = await anonClient().auth.signInWithOtp({ email: uniqueEmail("gmail.com"), options: { shouldCreateUser: true } });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/campus/i);
  });

  it("queues the unknown domain for review instead of ignoring it", async () => {
    const { data } = await serviceClient().from("domain_requests").select("domain").eq("domain", "gmail.com");
    expect(data?.length).toBeGreaterThan(0);
  });

  it("creates users, membership, and profile for a campus address and puts the tenant in the JWT", async () => {
    const claims = (await iitUser.auth.getClaims()).data!.claims as { app_metadata?: { university_id?: string } };
    expect(claims.app_metadata?.university_id).toBe(IIT_ID);

    const { data: me } = await iitUser.from("users").select("campus_username, name_pending, email").eq("id", iitUserId).single();
    expect(me?.name_pending).toBe(true);
    expect(me?.campus_username).toMatch(/^jdoe/);

    const { data: membership } = await iitUser.from("memberships").select("campus_role, status, university_id").eq("user_id", iitUserId).single();
    expect(membership).toMatchObject({ campus_role: "student", status: "active", university_id: IIT_ID });
  });

  it("maps a legacy hawk.iit.edu address to the same tenant", async () => {
    const legacy = await signUpWithOtp(uniqueEmail("hawk.iit.edu", "legacy"));
    const claims = (await legacy.auth.getClaims()).data!.claims as { app_metadata?: { university_id?: string } };
    expect(claims.app_metadata?.university_id).toBe(IIT_ID);
  });
});

describe("declared name", () => {
  it("is written once, generates the display name, and flags whether it matches the UID", async () => {
    const { error } = await iitUser.rpc("declare_name", { given: "Jane", family: "Doe", age_attested: true });
    expect(error).toBeNull();
    const { data: me } = await iitUser.from("users").select("name_pending, name_matches_username, declared_given_name").eq("id", iitUserId).single();
    expect(me).toMatchObject({ name_pending: false, name_matches_username: true, declared_given_name: "Jane" });
    const { data: profile } = await iitUser.from("profiles").select("display_name, initials").eq("user_id", iitUserId).single();
    expect(profile).toMatchObject({ display_name: "Jane D.", initials: "JD" });
  });

  it("cannot be changed again by the owner", async () => {
    const { error } = await iitUser.rpc("declare_name", { given: "Someone", family: "Else", age_attested: true });
    expect(error).not.toBeNull();
    expect(error!.message).toMatch(/locked/i);
  });

  it("cannot be edited through the profiles table either", async () => {
    await iitUser.from("profiles").update({ display_name: "Admin", campus_username: "root" }).eq("user_id", iitUserId);
    const { data } = await iitUser.from("profiles").select("display_name, campus_username").eq("user_id", iitUserId).single();
    expect(data?.display_name).toBe("Jane D.");
    expect(data?.campus_username).not.toBe("root");
  });

  it("privacy mode reduces the display name to initials", async () => {
    await iitUser.from("profiles").update({ privacy_mode: true }).eq("user_id", iitUserId);
    const { data } = await iitUser.from("profiles").select("display_name").eq("user_id", iitUserId).single();
    expect(data?.display_name).toBe("JD");
    await iitUser.from("profiles").update({ privacy_mode: false }).eq("user_id", iitUserId);
  });
});

describe("tenant isolation", () => {
  it("a Demo University user cannot see Illinois Tech profiles, memberships, or domains", async () => {
    const profiles = await demoUser.from("profiles").select("id").eq("university_id", IIT_ID);
    const memberships = await demoUser.from("memberships").select("id").eq("university_id", IIT_ID);
    const domains = await demoUser.from("university_domains").select("domain").eq("university_id", IIT_ID);
    expect(profiles.data).toEqual([]);
    expect(memberships.data).toEqual([]);
    expect(domains.data).toEqual([]);
  });

  it("an Illinois Tech user sees only their own campus", async () => {
    const { data } = await iitUser.from("universities").select("id");
    expect(data?.map((u) => u.id)).toEqual([IIT_ID]);
  });

  it("nobody reads another user's private row or email", async () => {
    const { data } = await demoUser.from("users").select("email").eq("id", iitUserId);
    expect(data).toEqual([]);
    const { data: own } = await iitUser.from("users").select("email").eq("id", demoUserId);
    expect(own).toEqual([]);
  });

  it("the anonymous role sees nothing", async () => {
    const anon = anonClient();
    for (const table of ["users", "profiles", "memberships", "universities", "university_domains", "domain_requests", "audit_log", "consent_records"]) {
      const { data } = await anon.from(table).select("*").limit(1);
      expect(data ?? []).toEqual([]);
    }
  });

  it("a student cannot change roles or campus settings; an admin can", async () => {
    const asStudent = await iitUser.from("memberships").update({ campus_role: "university_admin" }).eq("user_id", iitUserId).select();
    expect(asStudent.data ?? []).toEqual([]);
    await setRole(iitUserId, "university_admin");
    const asAdmin = await iitUser.from("universities").update({ short_name: "Illinois Tech" }).eq("id", IIT_ID).select("id");
    expect(asAdmin.data?.length).toBe(1);
    const cross = await iitUser.from("universities").update({ short_name: "Hacked" }).eq("id", DEMO_ID).select("id");
    expect(cross.data ?? []).toEqual([]);
    await setRole(iitUserId, "student");
  });

  it("the audit log is append-only even for the service role", async () => {
    const admin = serviceClient();
    const { data } = await admin.from("audit_log").select("id").limit(1);
    if (data && data.length) {
      const { error } = await admin.from("audit_log").delete().eq("id", data[0].id);
      expect(error).not.toBeNull();
    }
  });
});
