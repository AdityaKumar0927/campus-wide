/**
 * Compiles src/sw.ts to public/sw.js with esbuild (ARCHITECTURE.md D-07: Serwist core, no webpack
 * plugin). Runs before every build, so the worker is always in step with the app.
 */
import { build } from "esbuild";

const result = await build({
  entryPoints: ["src/sw.ts"],
  outfile: "public/sw.js",
  bundle: true,
  minify: true,
  format: "iife",
  target: ["chrome120", "safari17", "firefox120"],
  define: { "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV ?? "production") },
  logLevel: "warning",
  metafile: true,
});
const bytes = Object.values(result.metafile.outputs)[0]?.bytes ?? 0;
console.log(`service worker built: public/sw.js (${(bytes / 1024).toFixed(1)} kB)`);
