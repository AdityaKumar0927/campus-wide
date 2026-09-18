import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { signInNewStudent } from "./auth.helpers";

test.describe("marketplace relay", () => {
  test("take a tab, talk through the board, reveal only on mutual consent, never leak an address", async ({ browser }, testInfo) => {
    test.setTimeout(240_000);
    const sellerCtx = await browser.newContext();
    const seller = await sellerCtx.newPage();
    const { email: sellerEmail } = await signInNewStudent(seller, { given: "Sara", family: "Seller" });

    // Pin a listing
    await seller.goto("/post?type=listing");
    await expect(seller.locator('input[name="type"][value="listing"]')).toBeChecked();
    const title = `Commuter bike, new brakes ${Date.now() % 100000}`;
    await seller.getByLabel("What are you selling?").fill(title);
    await seller.getByLabel("Price (USD)").fill("60");
    await seller.getByLabel("Condition, pickup, anything a buyer should know").fill("Lock included. Meet at the library desk.");
    await seller.getByRole("button", { name: "Pin it to the board" }).click();
    await expect(seller).toHaveURL(/\/p\/[0-9a-f-]{36}$/);
    const postUrl = seller.url();
    await expect(seller.getByText("$60")).toBeVisible();
    await expect(seller.getByText("No tabs taken yet")).toBeVisible();

    // A prohibited listing is refused
    await seller.goto("/post?type=listing");
    await seller.getByLabel("What are you selling?").fill("Two meal swipes, cheap");
    await seller.getByLabel("Price (USD)").fill("5");
    await seller.getByRole("button", { name: "Pin it to the board" }).click();
    await expect(seller.getByText(/cannot be listed here/)).toBeVisible();

    // The buyer takes a tab
    const buyerCtx = await browser.newContext();
    const buyer = await buyerCtx.newPage();
    const { email: buyerEmail } = await signInNewStudent(buyer, { given: "Ben", family: "Buyer" });
    await buyer.goto(postUrl);
    await buyer.getByRole("button", { name: "Take a tab" }).click();
    await expect(buyer).toHaveURL(/\/t\/[0-9a-f-]{36}$/);
    const threadUrl = buyer.url();
    await buyer.getByLabel("Message", { exact: true }).fill("Is the bike still available? I can do Thursday.");
    await buyer.getByRole("button", { name: "Send" }).click();
    await expect(buyer.getByText("Is the bike still available?")).toBeVisible();
    await expect(buyer.getByText("One message until they answer")).toBeVisible();
    expect(await buyer.content()).not.toContain(sellerEmail);
    await new AxeBuilder({ page: buyer }).withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"]).analyze().then((r) => expect(r.violations, JSON.stringify(r.violations, null, 2)).toEqual([]));

    // The seller replies with a payment word and both see the caution
    await seller.goto("/threads");
    await seller.getByRole("link", { name: title }).click();
    await expect(seller).toHaveURL(threadUrl);
    const box = seller.getByLabel("Message", { exact: true });
    await box.fill("Yes. Library front desk at four? Zelle works too.");
    await expect(seller.getByRole("status")).toContainText(/Careful: zelle/);
    await seller.getByRole("button", { name: "Send" }).click();
    await expect(seller.getByText("Zelle works too.")).toBeVisible();
    await expect(seller.getByText(/mentioned payment/)).toBeVisible();
    expect(await seller.content()).not.toContain(buyerEmail);
    await seller.screenshot({ path: `test-results/screens/phase4-thread-${testInfo.project.name}.jpg`, type: "jpeg", quality: 80, fullPage: true });

    // Mutual reveal
    await buyer.reload();
    await buyer.getByRole("button", { name: "Share my email" }).click();
    await expect(buyer.getByRole("button", { name: "Stop sharing my email" })).toBeVisible();
    await expect(buyer.getByText("Appear only when both of you agree.")).toBeVisible();
    expect(await buyer.content()).not.toContain(sellerEmail);
    await seller.reload();
    await expect(seller.getByText(/shared theirs/)).toBeVisible();
    await seller.getByRole("button", { name: "Share my email" }).click();
    await expect(seller.getByText(buyerEmail)).toBeVisible();
    await buyer.reload();
    await expect(buyer.getByText(sellerEmail)).toBeVisible();

    // It happened, on both sides
    await buyer.getByRole("button", { name: "It happened" }).click();
    await expect(buyer.getByText("You confirmed. Waiting for them.")).toBeVisible();
    await seller.reload();
    await seller.getByRole("button", { name: "It happened" }).click();
    await expect(seller.getByText(/It happened · with Ben B\./)).toBeVisible();
    await sellerCtx.close();
    await buyerCtx.close();
  });
});
