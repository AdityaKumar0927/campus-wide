import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInNewStudent } from "./auth.helpers";
import { secretKey, setRole } from "./db.helpers";

async function axeClean(page: Page) {
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze();
  expect(axe.violations, JSON.stringify(axe.violations, null, 2)).toEqual([]);
}

test("report, decide with reasons, appeal, and a different moderator overturns", async ({ browser }, testInfo) => {
  test.skip(!secretKey, "needs the local service key to promote moderators");
  test.setTimeout(300_000);

  const subjectCtx = await browser.newContext();
  const subject = await subjectCtx.newPage();
  await signInNewStudent(subject, { given: "Sid", family: "Subject" });
  await subject.goto("/post?type=notice");
  const title = `Selling meal swipes, Zelle only ${testInfo.project.name} ${Math.random().toString(36).slice(2, 8)}`;
  await subject.getByLabel("What do you want the campus to know?").fill(title);
  await subject.getByRole("button", { name: "Pin it to the board" }).click();
  await expect(subject).toHaveURL(/\/p\/[0-9a-f-]{36}$/);
  const postUrl = subject.url();

  const reporterCtx = await browser.newContext();
  const reporter = await reporterCtx.newPage();
  await signInNewStudent(reporter, { given: "Rita", family: "Reporter" });
  await reporter.goto(postUrl);
  await reporter.getByRole("link", { name: "Report this notice" }).click();
  await expect(reporter).toHaveURL(/\/report\?type=post/);
  await reporter.getByLabel("Selling or trading meal credits").check();
  await reporter.getByLabel("Tell us more (optional)").fill("The title is literally resale.");
  await axeClean(reporter);
  await reporter.getByRole("button", { name: "File the report" }).click();
  await expect(reporter).toHaveURL(/\/reports\/CW-[A-F0-9]{6}$/);
  await expect(reporter.getByRole("heading", { level: 1, name: "Waiting for a moderator" })).toBeVisible();
  const caseNumber = reporter.url().split("/").pop()!;

  const modACtx = await browser.newContext();
  const modA = await modACtx.newPage();
  const a = await signInNewStudent(modA, { given: "Mona", family: "Moderator" });
  await setRole(a.uid, "moderator");
  await modA.goto("/mod");
  await expect(modA.getByRole("heading", { level: 1, name: "Moderation" })).toBeVisible();
  await modA.locator("li", { hasText: caseNumber }).getByRole("link").first().click();
  await expect(modA.getByText(caseNumber).first()).toBeVisible();
  await modA.getByLabel("Decision").selectOption("remove");
  await modA.getByLabel("The facts (what happened, in plain words)").fill("The title offers meal swipes for money.");
  await modA.getByLabel("The ground (which rule)").fill("Meal sharing policy 2: nothing is sold, lent, or traded");
  await modA.screenshot({ path: `test-results/screens/phase5-mod-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
  await modA.getByRole("button", { name: "Record the decision" }).click();
  await expect(modA.getByText(/Decision recorded.|This report is resolved./)).toBeVisible();
  await expect(modA.getByText("The title offers meal swipes for money.").first()).toBeVisible();
  await reporter.goto(`/reports/${caseNumber}`);
  await expect(reporter.getByRole("heading", { level: 1, name: "Actioned" })).toBeVisible();

  await subject.goto("/inbox");
  await subject.getByRole("link", { name: "A notice of yours was removed" }).first().click();
  await expect(subject).toHaveURL(/\/appeals\/[0-9a-f-]{36}$/);
  await expect(subject.getByText("The title offers meal swipes for money.")).toBeVisible();
  await expect(subject.getByText("No automated system took this decision.")).toBeVisible();
  await axeClean(subject);
  await subject.screenshot({ path: `test-results/screens/phase5-appeal-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });
  await subject.getByLabel("Why should this be reconsidered?").fill(`It was a joke between friends. Nothing was ever sold. (${title})`);
  await subject.getByRole("button", { name: "Send my appeal" }).click();
  await expect(subject.getByText(/Your appeal is in\.|Waiting for a different moderator/)).toBeVisible();

  await modA.goto("/mod/appeals");
  await expect(modA.getByText("You made this decision; someone else has to hear the appeal.")).toBeVisible();
  const modBCtx = await browser.newContext();
  const modB = await modBCtx.newPage();
  const b = await signInNewStudent(modB, { given: "Max", family: "Moderator" });
  await setRole(b.uid, "moderator");
  await modB.goto("/mod/appeals");
  const item = modB.locator("li", { hasText: title });
  await item.getByLabel("Overturn and restore").check();
  await item.getByLabel("Reasons").fill("Context shows a joke between friends; restored with a warning.");
  await item.getByRole("button", { name: "Decide" }).click();
  await expect(item).toHaveCount(0);
  await subject.goto(postUrl);
  await expect(subject.getByRole("heading", { level: 1, name: title })).toBeVisible();
  await expect(subject.getByText("removed by a moderator")).toHaveCount(0);

  for (const ctx of [subjectCtx, reporterCtx, modACtx, modBCtx]) await ctx.close();
});
