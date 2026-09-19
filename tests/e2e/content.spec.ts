import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInNewStudent } from "./auth.helpers";
import { secretKey, seedNotices, userIdFor } from "./db.helpers";

async function axeClean(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
}

test.describe("core content", () => {
  test("ask, answer, accept, thank: the inbox follows along", async ({ browser }, testInfo) => {
    test.setTimeout(180_000);
    const askerCtx = await browser.newContext();
    const a = await askerCtx.newPage();
    await signInNewStudent(a, { given: "Ava", family: "Askew" });

    // Ask
    await a.goto("/post");
    await a.locator('input[name="type"][value="question"]').check({ force: true });
    const title = `Does the 2am library shuttle run during reading week? ${Date.now()}`;
    await a.getByLabel("Your question").fill(title);
    await a.getByLabel("Details (optional)").fill("Asking for a friend who studies late. https://www.iit.edu/shuttle");
    await a.screenshot({ path: `test-results/screens/phase3-composer-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
    await a.getByRole("button", { name: "Pin it to the board" }).click();
    await expect(a).toHaveURL(/\/p\/[0-9a-f-]{36}$/);
    const postUrl = a.url();
    await expect(a.getByRole("heading", { level: 1, name: title })).toBeVisible();
    await expect(a.getByRole("link", { name: "iit.edu/shuttle" })).toHaveAttribute("rel", /noopener/);

    // Answer, as someone else
    const helperCtx = await browser.newContext();
    const h = await helperCtx.newPage();
    await signInNewStudent(h, { given: "Hank", family: "Helper" });
    await h.goto(postUrl);
    await h.getByLabel("Your answer").fill("Only the 10pm and midnight runs. The 2am one comes back with finals.");
    await h.getByRole("button", { name: "Post my answer" }).click();
    await expect(h.getByText("Only the 10pm and midnight runs.")).toBeVisible();
    await expect(h.getByRole("heading", { level: 2, name: "1 answer" })).toBeVisible();

    // Accept and thank, as the asker
    await a.reload();
    await a.getByRole("button", { name: "Accept this answer" }).click();
    await expect(a.getByText("Accepted answer")).toBeVisible();
    const thank = a.getByRole("button", { name: "Thank you to Hank H. for this answer" });
    await thank.click();
    await expect(thank).toHaveAttribute("aria-pressed", "true");
    await expect(thank).toContainText("Thank you · 1");
    await axeClean(a);
    await a.screenshot({ path: `test-results/screens/phase3-thread-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });

    // The helper hears about it
    await h.goto("/inbox");
    await expect(h.getByRole("link", { name: "Your answer was accepted" })).toBeVisible();
    await expect(h.getByRole("link", { name: "Ava A. thanked you" })).toBeVisible();
    await expect(h.getByText(/\d+ unread/).filter({ visible: true }).first()).toBeVisible();
    await axeClean(h);
    await h.screenshot({ path: `test-results/screens/phase3-inbox-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
    await h.getByRole("button", { name: "Mark all read" }).click();
    await expect(h.getByText("All read")).toBeVisible();

    // Answered questions leave the open list; search finds the thread
    await a.goto("/questions");
    await expect(a.getByRole("link", { name: title })).toHaveCount(0);
    await a.goto("/questions?show=all");
    await expect(a.getByRole("link", { name: title })).toBeVisible();
    await a.goto(`/search?q=${encodeURIComponent("library shuttle reading week")}`);
    await expect(a.getByRole("link", { name: title })).toBeVisible();

    // The profile counts the help
    await a.goto(postUrl);
    await a.getByRole("link", { name: "Hank H." }).first().click();
    await expect(a.getByRole("heading", { level: 1, name: "Hank H." })).toBeVisible();
    await expect(a.getByText("Helped").locator("..").getByText("1")).toBeVisible();
    await askerCtx.close();
    await helperCtx.close();
  });

  test("the feed is paged, never infinite", async ({ page }, testInfo) => {
    test.skip(!secretKey, "needs the local service key to seed notices");
    test.setTimeout(120_000);
    const { uid } = await signInNewStudent(page, { given: "Page", family: "Turner" });
    const authorId = await userIdFor(uid);
    await seedNotices(authorId, 25, `Paging notice ${Date.now() % 100000}`);
    await page.goto("/feed");
    await expect(page.getByRole("list", { name: "Notices" }).getByRole("listitem")).toHaveCount(20);
    await axeClean(page);
    await page.screenshot({ path: `test-results/screens/phase3-feed-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
    await page.getByRole("link", { name: "Load the next page" }).click();
    await expect(page).toHaveURL(/page=2/);
    await expect(page.getByText("Page 2")).toBeVisible();
    await expect(page.getByRole("link", { name: "Newer" })).toBeVisible();
  });

  test("spaces can be joined and pinned into", async ({ page }) => {
    test.setTimeout(120_000);
    await signInNewStudent(page, { given: "Sam", family: "Spaces" });
    await page.goto("/spaces");
    await page.getByRole("button", { name: "Join First-years" }).click();
    await expect(page.getByRole("button", { name: "Leave First-years" })).toBeVisible();
    await page.getByRole("link", { name: "First-years" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "First-years" })).toBeVisible();
    await page.getByRole("link", { name: "Pin here" }).click();
    await expect(page.getByLabel("Where does it belong?")).toHaveValue(/./);
    await axeClean(page);
  });
});
