import { randomUUID } from "node:crypto";
import { expect, type Page } from "@playwright/test";

const mailpit = process.env.MAILPIT_URL ?? "http://127.0.0.1:54324";

export function uniqueEmail(prefix = "jdoe") {
  return `${prefix}${randomUUID().replace(/-/g, "").slice(0, 10)}@hawk.illinoistech.edu`;
}

export async function readOtpCode(email: string, attempts = 30): Promise<string> {
  for (let i = 0; i < attempts; i++) {
    const res = await fetch(`${mailpit}/api/v1/search?query=${encodeURIComponent(`to:${email}`)}&limit=5`);
    const json = (await res.json()) as { messages: { ID: string; To: { Address: string }[] }[] };
    const msg = json.messages?.find((m) => m.To.some((t) => t.Address.toLowerCase() === email.toLowerCase()));
    if (msg) {
      const body = (await (await fetch(`${mailpit}/api/v1/message/${msg.ID}`)).json()) as { Text: string; HTML: string };
      const m = (body.Text || body.HTML).match(/\b(\d{6})\b/);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`no OTP email for ${email}`);
}

/** Signs a brand-new Illinois Tech student in through the real UI and completes onboarding. */
export async function signInNewStudent(page: Page, opts: { given?: string; family?: string } = {}) {
  const email = uniqueEmail();
  await page.goto("/sign-in");
  await page.getByLabel("Campus email").fill(email);
  await page.getByRole("button", { name: "Send me a code" }).click();
  const code = await readOtpCode(email);
  await page.getByLabel("Six-digit code").fill(code);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/onboarding/);
  await page.getByLabel("First name").fill(opts.given ?? "Jane");
  await page.getByLabel("Family name").fill(opts.family ?? "Doe");
  await page.getByLabel("I am 17 or older.").check();
  for (const box of await page.getByRole("checkbox", { name: /I will|I know|I understand|Nothing is bought|A meal treat/ }).all()) await box.check();
  await page.getByRole("button", { name: /Finish and open the board/ }).click();
  await expect(page).toHaveURL(/\/feed/);
  return { email, uid: email.split("@")[0] };
}
