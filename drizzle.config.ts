import { defineConfig } from "drizzle-kit";

/**
 * Drizzle owns the schema and RLS policies (src/lib/db/schema). Migrations are emitted with the
 * Supabase timestamp prefix so `supabase db reset`/`supabase migration up` apply them unchanged.
 */
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema/index.ts",
  out: "./supabase/migrations",
  migrations: { prefix: "supabase" },
  dbCredentials: {
    url: process.env.DIRECT_DATABASE_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres",
  },
  entities: { roles: { provider: "supabase" } },
  strict: true,
  verbose: true,
});
