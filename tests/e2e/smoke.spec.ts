import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const routes = [
  { path: "/", name: "landing" },
  { path: "/offline", name: "offline" },
];

for (const route of routes) {
  test.describe(route.name, () => {
    test("renders, is accessible, and matches the visual baseline", async ({ page }, testInfo) => {
      const response = await page.goto(route.path);
      expect(response?.ok()).toBe(true);

      // Security headers are present on every HTML response.
      const headers = response!.headers();
      expect(headers["content-security-policy"]).toMatch(/script-src 'self' 'nonce-/);
      expect(headers["x-content-type-options"]).toBe("nosniff");
      expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

      // No CSP violations reached the console.
      const violations: string[] = [];
      page.on("console", (m) => {
        if (m.text().includes("Content Security Policy")) violations.push(m.text());
      });

      await expect(page.locator("main")).toBeVisible();
      await expect(page).toHaveTitle(/Campus Wide/);
      // Fonts use display: optional; a second load renders with the now-cached web fonts, which keeps
      // screenshots deterministic.
      await page.evaluate(() => document.fonts.ready);
      await page.reload();
      await expect(page.locator("main")).toBeVisible();

      const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
      expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);

      expect(violations).toEqual([]);
      await expect(page).toHaveScreenshot(`${route.name}.png`, { fullPage: true, animations: "disabled" });
      // Always keep a full-page capture for human review (test-results/screens, uploaded by CI).
      const shot = await page.screenshot({
        fullPage: true,
        animations: "disabled",
        path: `test-results/screens/${route.name}-${testInfo.project.name}.png`,
      });
      await testInfo.attach(`${route.name}-${testInfo.project.name}`, { body: shot, contentType: "image/png" });
    });
  });
}

test("health endpoint responds without caching", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  expect(res.headers()["cache-control"]).toBe("no-store");
  expect(await res.json()).toMatchObject({ status: "ok", service: "campus-wide" });
});

test("security.txt is served", async ({ request }) => {
  const res = await request.get("/.well-known/security.txt");
  expect(res.ok()).toBe(true);
  expect(await res.text()).toContain("Contact:");
});

test("keyboard users can reach the primary navigation", async ({ page }) => {
  await page.goto("/");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  await expect(focused).toBeVisible();
});

test.describe("app shell", () => {
  test("feed and a placeholder section render inside the shell with no dead nav links", async ({ page }, testInfo) => {
    await page.goto("/feed");
    await expect(page.getByRole("heading", { level: 1, name: "Feed" })).toBeVisible();
    const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
    expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
    await page.screenshot({ fullPage: true, animations: "disabled", path: `test-results/screens/feed-${testInfo.project.name}.png` });

    // Every primary navigation target resolves to a real page.
    const nav = page.getByRole("navigation", { name: /primary|sections/i }).first();
    const hrefs = await nav.getByRole("link").evaluateAll((els) => els.map((e) => e.getAttribute("href")!));
    expect(hrefs.length).toBeGreaterThan(3);
    for (const href of hrefs) {
      const res = await page.request.get(href);
      expect(res.status(), `${href} should not be a dead link`).toBe(200);
    }

    await page.goto("/market");
    await expect(page.getByRole("heading", { level: 1, name: "Marketplace" })).toBeVisible();
    await page.goto("/definitely-not-a-section");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("taken down");
  });

  test("feedback popover collects a message and a sentiment, then thanks the user", async ({ page }) => {
    await page.goto("/feed");
    await page.getByRole("button", { name: "Feedback" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByLabel("What is on your mind?").fill("The bottom nav is lovely on a phone.");
    await dialog.getByRole("radio", { name: "Love it" }).click();
    await expect(dialog.getByRole("radio", { name: "Love it" })).toHaveAttribute("aria-checked", "true");
    await dialog.getByRole("button", { name: "Send" }).click();
    await expect(dialog.getByRole("status")).toContainText("Thank you");
  });

  test("theme can be switched to dark and back", async ({ page }) => {
    await page.goto("/feed");
    const trigger = page.getByRole("button", { name: "Change theme" });
    const menu = page.getByRole("menu");
    await trigger.click();
    await expect(menu).toBeVisible();
    await page.getByRole("menuitemradio", { name: "Dark" }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    await expect(menu).toBeHidden(); // let the close animation finish before reopening
    await trigger.click();
    await expect(menu).toBeVisible();
    await page.getByRole("menuitemradio", { name: "Light" }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
    await expect(menu).toBeHidden();
  });
});
