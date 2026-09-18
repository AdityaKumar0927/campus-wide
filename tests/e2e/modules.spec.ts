import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInNewStudent } from "./auth.helpers";
import { runExpirePosts, secretKey, seedExpiredNotice, userIdFor } from "./db.helpers";

async function axeClean(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
}

test.describe("modules", () => {
  test("events: pin, RSVP, and download the calendar file", async ({ browser }, testInfo) => {
    test.setTimeout(180_000);
    const hostCtx = await browser.newContext();
    const host = await hostCtx.newPage();
    await signInNewStudent(host, { given: "Hana", family: "Host" });
    await host.goto("/post?type=event");
    const title = `Jazz night ${Date.now() % 100000}`;
    await host.getByLabel("Event name").fill(title);
    await host.locator("#startsAt").fill("2027-03-05T20:00");
    await host.locator("#location").fill("MTCC, The Bog");
    await host.getByLabel("What to expect").fill("Free. Bring someone who has had a long week.");
    await host.getByRole("button", { name: "Pin it to the board" }).click();
    await expect(host).toHaveURL(/\/p\/[0-9a-f-]{36}$/);
    const postUrl = host.url();
    await expect(host.getByText("0 going")).toBeVisible();

    const guestCtx = await browser.newContext();
    const guest = await guestCtx.newPage();
    await signInNewStudent(guest, { given: "Gus", family: "Guest" });
    await guest.goto(postUrl);
    await guest.getByRole("button", { name: "RSVP" }).click();
    await expect(guest.getByText("1 going")).toBeVisible();
    await expect(guest.getByRole("button", { name: "Not going after all" })).toBeVisible();
    const ics = await guest.request.get(`${postUrl}/calendar.ics`);
    expect(ics.ok()).toBe(true);
    expect(ics.headers()["content-type"]).toContain("text/calendar");
    const body = await ics.text();
    expect(body).toContain("BEGIN:VEVENT");
    expect(body).toContain(`SUMMARY:${title}`);
    expect(body).toContain("DTSTART:20270306T020000Z");
    await axeClean(guest);
    await guest.screenshot({ path: `test-results/screens/phase4-event-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });

    await guest.goto("/events");
    await expect(guest.getByRole("link", { name: title })).toBeVisible();
    await hostCtx.close();
    await guestCtx.close();
  });

  test("polls: one vote per student, changeable while open", async ({ page }, testInfo) => {
    test.setTimeout(120_000);
    await signInNewStudent(page, { given: "Pat", family: "Poll" });
    await page.goto("/post?type=poll");
    await page.getByLabel("Your question").fill(`Best late-night food? ${Date.now() % 100000}`);
    await page.getByLabel("Option 1").fill("Bog tots");
    await page.getByLabel("Option 2").fill("Jerk chicken on 35th");
    await page.getByRole("button", { name: "Pin it to the board" }).click();
    await expect(page).toHaveURL(/\/p\/[0-9a-f-]{36}$/);
    await page.getByRole("button", { name: "Jerk chicken on 35th" }).click();
    await expect(page.getByRole("button", { name: /Jerk chicken on 35th/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("100% · 1")).toBeVisible();
    await page.getByRole("button", { name: /Bog tots/ }).click();
    await expect(page.getByRole("button", { name: /Bog tots/ })).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByText("1 vote.")).toBeVisible();
    await axeClean(page);
    await page.screenshot({ path: `test-results/screens/phase4-poll-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
  });

  test("expiry: the sweeper takes notices down", async ({ page }) => {
    test.skip(!secretKey, "needs the local service key");
    test.setTimeout(120_000);
    const { uid } = await signInNewStudent(page, { given: "Ex", family: "Pired" });
    const id = await seedExpiredNotice(await userIdFor(uid), `Old notice ${Date.now() % 100000}`);
    await new Promise((r) => setTimeout(r, 2500));
    await runExpirePosts();
    await page.goto(`/p/${id}`);
    await expect(page.getByText(/· expired/)).toBeVisible();
    await expect(page.getByText("This notice is closed.")).toBeVisible();
  });

  test("meal gifting stays switched off until the campus opts in", async ({ page }) => {
    test.setTimeout(120_000);
    await signInNewStudent(page, { given: "Mo", family: "Meals" });
    await page.goto("/meals");
    await expect(page.getByText("Switched off on this campus")).toBeVisible();
    await expect(page.getByText(/Decision M-5/)).toBeVisible();
    await page.goto("/post");
    await expect(page.locator('input[name="type"][value="meal"]')).toHaveCount(0);
    await expect(page.locator('input[name="type"][value="ride"]')).toHaveCount(1);
    await axeClean(page);
  });
});
