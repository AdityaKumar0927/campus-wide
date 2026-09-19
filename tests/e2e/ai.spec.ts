import { expect, test } from "@playwright/test";
import { signInNewStudent } from "./auth.helpers";

/**
 * The no-AI path (PLAN.md Phase 6 DoD): with browser models off and no server key, every flow works
 * and no AI element appears. Headless Chromium has no Prompt API either.
 */
test("asking and answering work with no models, and no AI element appears", async ({ page }) => {
  test.setTimeout(120_000);
  await signInNewStudent(page, { given: "Noa", family: "Model" });
  await page.goto("/post");
  await page.locator('input[name="type"][value="question"]').check({ force: true });
  await page.getByLabel("Your question").fill("Does the 2am library shuttle run during reading week at all?");
  await page.getByLabel("Details (optional)").fill("Asking for a friend who studies late and gets nervous walking back alone.");
  await page.waitForTimeout(1500);
  await expect(page.getByText("Already asked?")).toHaveCount(0);
  await expect(page.locator('input[name="embedding"]')).toHaveCount(0);
  await expect(page.getByText(/This reads/)).toHaveCount(0);
  await page.getByRole("button", { name: "Pin it to the board" }).click();
  await expect(page).toHaveURL(/\/p\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("button", { name: "Summarise this thread" })).toHaveCount(0);
  await page.goto("/settings");
  await expect(page.getByText("Browser models are switched off on this deployment.")).toBeVisible();
});
