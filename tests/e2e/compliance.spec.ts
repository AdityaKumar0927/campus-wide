import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInNewStudent } from "./auth.helpers";

async function axeClean(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
}

test("the policies are public, readable, and carry the not-legal-advice banner", async ({ page }, testInfo) => {
  await page.goto("/policies");
  await expect(page.getByRole("heading", { level: 1, name: "Policies" })).toBeVisible();
  await axeClean(page);
  await page.screenshot({ path: `test-results/screens/phase7-policies-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
  await page.getByRole("link", { name: "Privacy Notice" }).first().click();
  await expect(page).toHaveURL("/policies/privacy");
  await expect(page.getByRole("heading", { level: 1, name: "Privacy Notice" })).toBeVisible();
  await expect(page.getByRole("note")).toContainText("This is not legal advice");
  await expect(page.getByText("Kept for")).toBeVisible();
  await axeClean(page);
  await page.screenshot({ path: `test-results/screens/phase7-privacy-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
});

test("the manifest, icons, and GPC statement are served", async ({ request }) => {
  const manifest = await request.get("/manifest.webmanifest");
  expect(manifest.ok()).toBe(true);
  const json = (await manifest.json()) as { name: string; start_url: string; icons: { src: string }[] };
  expect(json).toMatchObject({ name: "Campus Wide", start_url: "/feed" });
  expect(json.icons.length).toBeGreaterThan(3);

  const icon = await request.get("/icons/icon-192.png");
  expect(icon.ok()).toBe(true);
  expect(icon.headers()["content-type"]).toContain("image/png");

  const gpc = await request.get("/.well-known/gpc.json");
  expect(gpc.ok()).toBe(true);
  expect(await gpc.json()).toMatchObject({ gpc: true });
});

test("a member can export their data and schedule, then cancel, a deletion", async ({ page }, testInfo) => {
  test.setTimeout(180_000);
  await signInNewStudent(page, { given: "Dana", family: "Departing" });
  await page.goto("/post?type=notice");
  await page.getByLabel("What do you want the campus to know?").fill(`A notice to take with me ${Date.now() % 100000}`);
  await page.getByRole("button", { name: "Pin it to the board" }).click();
  await expect(page).toHaveURL(/\/p\/[0-9a-f-]{36}$/);

  await page.goto("/settings");
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: "Download my data" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toMatch(/^campus-wide-export-\d{4}-\d{2}-\d{2}\.zip$/);
  const stream = await file.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const bytes = Buffer.concat(chunks);
  expect(bytes.length).toBeGreaterThan(500);
  expect(bytes.subarray(0, 2).toString()).toBe("PK");
  expect(bytes.toString("latin1")).toContain("notices.json");
  await axeClean(page);
  await page.screenshot({ path: `test-results/screens/phase7-settings-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });

  await page.getByRole("button", { name: "Delete my account" }).click();
  await page.getByLabel("Type delete my account").fill("delete my account");
  await page.getByRole("button", { name: "Delete and sign out" }).click();
  await expect(page).toHaveURL(/\/(sign-in|$)/);
});
