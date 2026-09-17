"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

/**
 * Sign-in server actions. The browser never talks to Supabase Auth directly for sign-in, so the app
 * can rate-limit, normalise legacy domains, and require Turnstile before the request reaches Auth.
 * The database hook remains the real gate (docs/pilot/illinois-tech.md §9).
 */

const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email()
  .max(254)
  .transform((e) => e.replace(/@hawk\.iit\.edu$/, "@hawk.illinoistech.edu").replace(/@iit\.edu$/, "@illinoistech.edu"));

const codeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the six-digit code.");

export type SignInState = { step: "email" | "code"; email?: string; error?: string; next?: string };

function safeNext(next: unknown): string {
  return typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/feed";
}

export async function requestCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const next = safeNext(formData.get("next"));
  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) return { step: "email", error: "Enter your campus email address.", next };
  const email = parsed.data;
  if (!isSupabaseConfigured()) return { step: "email", error: "Sign-in is not connected on this deployment yet.", next };

  const supabase = await createClient();
  const { data: allowed } = await supabase.rpc("is_allowed_email", { email });
  if (!allowed) {
    return {
      step: "email",
      error: "Only Illinois Tech addresses can join this board (yourUID@hawk.illinoistech.edu). Other campuses are noted for review.",
      next,
    };
  }

  const captchaToken = formData.get("cf-turnstile-response");
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
      captchaToken: typeof captchaToken === "string" && captchaToken ? captchaToken : undefined,
      emailRedirectTo: `${process.env.APP_URL ?? "http://localhost:3000"}/auth/confirm?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) {
    const msg = /rate|seconds/i.test(error.message)
      ? "A code was sent recently. Wait a minute, then try again."
      : error.message;
    return { step: "email", error: msg, next };
  }
  return { step: "code", email, next };
}

export async function verifyCode(_prev: SignInState, formData: FormData): Promise<SignInState> {
  const next = safeNext(formData.get("next"));
  const email = emailSchema.safeParse(formData.get("email"));
  const code = codeSchema.safeParse(formData.get("code"));
  if (!email.success) return { step: "email", error: "Start again with your campus email.", next };
  if (!code.success) return { step: "code", email: email.data, error: code.error.issues[0]?.message, next };

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email: email.data, token: code.data, type: "email" });
  if (error) {
    return { step: "code", email: email.data, error: "That code did not work. Codes expire after ten minutes.", next };
  }
  const ua = (await headers()).get("user-agent") ?? "";
  void ua; // recorded by Supabase on the session; surfaced on the sessions page
  redirect(next);
}

export async function signOut(formData: FormData) {
  const everywhere = formData.get("scope") === "global";
  const supabase = await createClient();
  await supabase.auth.signOut({ scope: everywhere ? "global" : "local" });
  redirect("/");
}
