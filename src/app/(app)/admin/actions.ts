"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AuthError, requireRole } from "@/lib/dal/session";
import { FLAG_KEYS } from "@/lib/moderation/constants";
import { createClient } from "@/lib/supabase/server";

export type AdminState = { error?: string; ok?: string };

async function admin() {
  try {
    return await requireRole("university_admin");
  } catch (e) {
    if (e instanceof AuthError) redirect(e.code === "signed_out" ? "/sign-in?next=/admin" : "/feed");
    throw e;
  }
}

function done(ok: string): AdminState {
  revalidatePath("/admin");
  revalidatePath("/feed");
  revalidatePath("/post");
  return { ok };
}

const campusSchema = z.object({
  name: z.string().trim().min(3).max(120),
  shortName: z.string().trim().min(2).max(40),
  accentHue: z.coerce.number().int().min(0).max(360),
  timezone: z.string().trim().min(3).max(60),
});

export async function updateCampus(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await admin();
  const parsed = campusSchema.safeParse({ name: formData.get("name"), shortName: formData.get("shortName"), accentHue: formData.get("accentHue"), timezone: formData.get("timezone") });
  if (!parsed.success) return { error: "Check the campus details." };
  const supabase = await createClient();
  const { error } = await supabase.from("universities").update({ name: parsed.data.name, short_name: parsed.data.shortName, accent_hue: String(parsed.data.accentHue), timezone: parsed.data.timezone }).eq("id", session.universityId);
  return error ? { error: error.message } : done("Campus details saved.");
}


export async function setFlag(flag: string, on: boolean): Promise<void> {
  const session = await admin();
  if (!FLAG_KEYS.includes(flag as (typeof FLAG_KEYS)[number])) return;
  const supabase = await createClient();
  const { data } = await supabase.from("universities").select("feature_flags").eq("id", session.universityId).single();
  const flags = { ...((data?.feature_flags as Record<string, boolean>) ?? {}), [flag]: on };
  await supabase.from("universities").update({ feature_flags: flags }).eq("id", session.universityId);
  revalidatePath("/admin");
  revalidatePath("/post");
  revalidatePath("/", "layout");
}

export async function updatePolicyText(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await admin();
  const key = String(formData.get("key") ?? "");
  const text = String(formData.get("text") ?? "").trim().slice(0, 4000);
  if (!/^[a-z_]{2,40}$/.test(key)) return { error: "Bad policy key." };
  const supabase = await createClient();
  const { data } = await supabase.from("universities").select("policy_text").eq("id", session.universityId).single();
  const policy = { ...((data?.policy_text as Record<string, string>) ?? {}), [key]: text };
  const { error } = await supabase.from("universities").update({ policy_text: policy }).eq("id", session.universityId);
  return error ? { error: error.message } : done(`Policy text ${key} saved.`);
}

const spotsSchema = z.array(z.object({ name: z.string().trim().min(2).max(120), note: z.string().trim().max(200).optional(), campus: z.string().trim().max(60).optional() })).max(20);

export async function saveSafeSpots(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await admin();
  const lines = String(formData.get("spots") ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [name, note, campus] = l.split("|").map((s) => s.trim());
      return { name, note: note || undefined, campus: campus || undefined };
    });
  const parsed = spotsSchema.safeParse(lines);
  if (!parsed.success) return { error: "One spot per line: name | note | campus." };
  const supabase = await createClient();
  const { error } = await supabase.from("universities").update({ safe_exchange_locations: parsed.data }).eq("id", session.universityId);
  return error ? { error: error.message } : done("Safe-exchange spots saved.");
}

export async function addDomain(_prev: AdminState, formData: FormData): Promise<AdminState> {
  const session = await admin();
  const domain = String(formData.get("domain") ?? "").trim().toLowerCase();
  const role = formData.get("role") === "staff" ? "staff" : "student";
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) return { error: "Enter a domain like hawk.example.edu." };
  const supabase = await createClient();
  const { error } = await supabase.from("university_domains").insert({ university_id: session.universityId, domain, role, verified: true, source: "admin" });
  return error ? { error: /duplicate|unique/i.test(error.message) ? "That domain is already listed." : error.message } : done(`Domain ${domain} added.`);
}

export async function removeDomain(id: string): Promise<void> {
  await admin();
  const supabase = await createClient();
  await supabase.from("university_domains").delete().eq("id", id).eq("source", "admin");
  revalidatePath("/admin");
}

export async function setMemberRole(userId: string, role: "student" | "staff" | "moderator" | "university_admin"): Promise<void> {
  const session = await admin();
  if (userId === session.userId) return;
  const supabase = await createClient();
  await supabase.from("memberships").update({ campus_role: role }).eq("user_id", userId);
  revalidatePath("/admin");
}

export async function findMember(_prev: AdminState, formData: FormData): Promise<AdminState> {
  await admin();
  const username = String(formData.get("username") ?? "").trim().toLowerCase().replace(/^@/, "");
  if (!username) return { error: "Enter a handle." };
  redirect(`/admin?member=${encodeURIComponent(username)}`);
}
