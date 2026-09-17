/**
 * Lighthouse budget check (PLAN.md Phase 1 DoD: ≥ 95 in every category at mobile and desktop).
 * Usage: start the production server (`pnpm build && pnpm start`), then `pnpm lighthouse`.
 * Env: LH_BASE_URL (default http://localhost:3000), LH_ROUTES (comma list), LH_MIN_SCORE, CHROME_PATH.
 *
 * Caveat for localhost runs: the "simulate" throttling model builds a dependency graph from the observed
 * trace; when every request finishes within milliseconds, scripts complete before the first paint and get
 * counted as LCP dependencies, so the performance score reads 10-20 points low for text-LCP pages. Observed
 * TTFB/LCP are printed for comparison. Run against a deployed URL for a representative performance score.
 */
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { launch } from "chrome-launcher";
import lighthouse from "lighthouse";

const base = process.env.LH_BASE_URL ?? "http://localhost:3000";
// Routes may be given without a leading slash ("root,feed,offline") so Git Bash on Windows does not
// rewrite "/" into a filesystem path.
const routes = (process.env.LH_ROUTES ?? "root,feed,offline")
  .split(",")
  .map((r) => r.trim())
  .filter(Boolean)
  .map((r) => (r === "root" || r === "/" ? "/" : r.startsWith("/") ? r : "/" + r));
const minScore = Number(process.env.LH_MIN_SCORE ?? 0.95);
const outDir = join(process.cwd(), "lighthouse-reports");
mkdirSync(outDir, { recursive: true });

/** Prefer CHROME_PATH; otherwise reuse Playwright's Chromium on Windows dev machines. */
function findChrome() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const local = process.env.LOCALAPPDATA;
  if (!local) return undefined;
  const root = join(local, "ms-playwright");
  if (!existsSync(root)) return undefined;
  const dirs = readdirSync(root).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse();
  for (const d of dirs) {
    const exe = join(root, d, "chrome-win", "chrome.exe");
    if (existsSync(exe)) return exe;
  }
  return undefined;
}

const chrome = await launch({ chromePath: findChrome(), chromeFlags: ["--headless=new", "--no-sandbox"] });
let failed = false;
try {
  for (const formFactor of ["mobile", "desktop"]) {
    for (const route of routes) {
      const url = new URL(route, base).toString();
      const result = await lighthouse(url, {
        port: chrome.port,
        output: "html",
        logLevel: "error",
        formFactor,
        screenEmulation:
          formFactor === "mobile"
            ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 3, disabled: false }
            : { mobile: false, width: 1440, height: 900, deviceScaleFactor: 1, disabled: false },
        throttlingMethod: "simulate",
        onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      });
      const scores = Object.fromEntries(Object.entries(result.lhr.categories).map(([k, v]) => [k, v.score ?? 0]));
      const name = `${formFactor}-${route.replace(/\W+/g, "_") || "root"}`;
      writeFileSync(join(outDir, `${name}.html`), result.report);
      const bad = Object.entries(scores).filter(([, s]) => s < minScore);
      const line = Object.entries(scores).map(([k, s]) => `${k}=${Math.round(s * 100)}`).join(" ");
      console.log(`${bad.length ? "FAIL" : "ok  "} ${formFactor.padEnd(7)} ${route.padEnd(10)} ${line}`);
      if (bad.length || process.env.LH_VERBOSE) {
        const a = result.lhr.audits;
        const m = ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"]
          .map((k) => `${k.replace(/-/g, " ")}=${a[k]?.displayValue}`)
          .join(", ");
        const lcpNode = a["largest-contentful-paint-element"]?.details?.items?.[0]?.items?.[0]?.node;
        const obs = a["metrics"]?.details?.items?.[0] ?? {};
        console.log(`      ${m}`);
        console.log(`      observed: TTFB=${Math.round(a["server-response-time"]?.numericValue ?? 0)}ms, FCP=${Math.round(obs.observedFirstContentfulPaint ?? 0)}ms, LCP=${Math.round(obs.observedLargestContentfulPaint ?? 0)}ms`);
        if (lcpNode) console.log(`      LCP element: ${(lcpNode.nodeLabel ?? lcpNode.snippet ?? "").slice(0, 90)}`);
        const lcpPhases = a["largest-contentful-paint-element"]?.details?.items?.[1]?.items;
        if (lcpPhases) console.log(`      LCP phases: ${lcpPhases.map((p) => `${p.phase} ${Math.round(p.timing)}ms`).join(", ")}`);
      }
      if (bad.length) failed = true;
    }
  }
} finally {
  await chrome.kill();
}
if (failed) {
  console.error(`Lighthouse budget not met (min ${minScore * 100}). Reports in ${outDir}`);
  process.exit(1);
}
