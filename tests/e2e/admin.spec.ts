import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInNewStudent } from "./auth.helpers";
import { latestFeedback, secretKey, setRole } from "./db.helpers";

async function axeClean(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
}

test("an admin can switch a module off and on", async ({ page }, testInfo) => {
  test.skip(!secretKey, "needs the local service key to promote an admin");
  test.setTimeout(180_000);
  const me = await signInNewStudent(page, { given: "Ada", family: "Admin" });
  await setRole(me.uid, "university_admin");
  await page.goto("/admin");
  await expect(page.getByRole("heading", { level: 1, name: "Campus admin" })).toBeVisible();
  await axeClean(page);
  await page.screenshot({ path: `test-results/screens/phase5-admin-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
  await page.getByRole("button", { name: "Polls: on" }).click();
  await expect(page.getByRole("button", { name: "Polls: off" })).toBeVisible();
  await page.goto("/polls");
  await expect(page.getByText("Switched off on this campus")).toBeVisible();
  await page.goto("/admin");
  await page.getByRole("button", { name: "Polls: off" }).click();
  await expect(page.getByRole("button", { name: "Polls: on" })).toBeVisible();
});

test("feedback lands in the database", async ({ page }) => {
  test.skip(!secretKey, "needs the local service key to read feedback");
  test.setTimeout(120_000);
  await signInNewStudent(page, { given: "Fay", family: "Feedback" });
  await page.goto("/feed");
  await page.getByRole("button", { name: "Feedback" }).click();
  const dialog = page.getByRole("dialog");
  const message = `The bottom nav is lovely on a phone ${Date.now() % 100000}`;
  await dialog.getByLabel("What is on your mind?").fill(message);
  await dialog.getByRole("radio", { name: "Love it" }).click();
  await dialog.getByRole("button", { name: "Send" }).click();
  await expect(dialog.getByRole("status")).toContainText(/Thanks/);
  const rows = await latestFeedback();
  expect(rows.some((r) => r.message === message && r.sentiment === "love" && r.page_url === "/feed")).toBe(true);
});

test("public campus numbers are readable signed out", async ({ page }) => {
  await page.goto("/campus/illinois-tech");
  await expect(page.getByRole("heading", { level: 1, name: "Illinois Institute of Technology" })).toBeVisible();
  await expect(page.getByText("Verified members")).toBeVisible();
  await axeClean(page);
});
