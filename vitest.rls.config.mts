import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/** Integration tests against the local Supabase stack. Run: pnpm test:rls (after `supabase start`). */
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["tests/rls/**/*.test.ts"],
    environment: "node",
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false,
    setupFiles: ["tests/rls/setup.ts"],
  },
});
