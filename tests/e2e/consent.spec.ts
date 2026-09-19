import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInNewStudent } from "./auth.helpers";
import { bumpPolicy, dropPolicyVersion, secretKey } from "./db.helpers";

/**
 * Publishing a required policy version gates every member of the campus, so this file runs in its own
 * Playwright project after the others have finished (see playwright.config.ts). Keeping it here rather
 * than deleting the coverage is deliberate: the re-consent gate is the one flow that can lock everyone
 * out if it regresses.
 */
async function axeClean(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
}

test("a changed policy is read and accepted before the board opens again", async ({ page }) => {
  test.skip(!secretKey, "needs the local service key to publish a policy version");
  test.setTimeout(180_000);
  await signInNewStudent(page, { given: "Rea", family: "Consent" });
  const version = await bumpPolicy("terms", "Terms of Service");
  try {
    await page.goto("/feed");
    await expect(page).toHaveURL("/consent");
    await expect(page.getByRole("heading", { level: 1, name: "A policy changed" })).toBeVisible();
    await expect(page.getByText(`Version ${version}`)).toBeVisible();
    await axeClean(page);
    await page.getByLabel(/I have read it and I accept/).check();
    await page.getByRole("button", { name: "Accept and continue" }).click();
    await expect(page).toHaveURL("/feed");
  } finally {
    await dropPolicyVersion(version);
  }
});
