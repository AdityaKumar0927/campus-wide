/**
 * Owner look-review screenshots: full-page JPEGs at 1x CSS scale for 390 px and 1440 px.
 *   pnpm build && node scripts/with-server.mjs node scripts/screenshots.mjs <tag> [routes...]
 * Output: docs/screenshots/<tag>/<route>-<viewport>.jpg (small enough to commit).
 */
import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { chromium, devices } from "@playwright/test";

const [tag = "review", ...routeArgs] = process.argv.slice(2);
const routes = routeArgs.length ? routeArgs : ["root", "feed", "market", "offline"];
const base = process.env.LH_BASE_URL ?? "http://localhost:3000";
const outDir = join(process.cwd(), "docs", "screenshots", tag);
mkdirSync(outDir, { recursive: true });

const viewports = {
  mobile: { ...devices["iPhone 14"], deviceScaleFactor: 1, viewport: { width: 390, height: 844 } },
  desktop: { viewport: { width: 1440, height: 900 } },
};

const browser = await chromium.launch();
try {
  for (const [name, ctxOpts] of Object.entries(viewports)) {
    // SHOT_MOTION=1 captures with animations running (for reviewing motion pieces); default is deterministic.
    const context = await browser.newContext({ ...ctxOpts, colorScheme: "light", reducedMotion: process.env.SHOT_MOTION ? "no-preference" : "reduce" });
    const page = await context.newPage();
    for (const route of routes) {
      const path = route === "root" ? "/" : `/${route.replace(/^\/+/, "")}`;
      await page.goto(new URL(path, base).toString(), { waitUntil: "networkidle" });
      await page.reload({ waitUntil: "networkidle" }); // fonts are display: optional; second load has them cached
      const file = join(outDir, `${route}-${name}.jpg`);
      await page.screenshot({ path: file, fullPage: true, type: "jpeg", quality: 82 });
      console.log("saved", file.replace(process.cwd(), "."));
    }
    await context.close();
  }
} finally {
  await browser.close();
}
