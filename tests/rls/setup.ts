import { existsSync } from "node:fs";

// Load local Supabase credentials without adding a dependency (Node ≥ 20.12).
for (const file of [".env.local", ".env.test"]) {
  if (existsSync(file)) {
    try {
      process.loadEnvFile(file);
    } catch {}
  }
}
