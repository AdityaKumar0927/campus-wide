/**
 * Supabase connection settings. Accepts both our names (.env.example) and the names the Vercel
 * Supabase integration injects (NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
 * POSTGRES_URL, POSTGRES_URL_NON_POOLING), so a Marketplace-created project works without renaming.
 */
export const supabaseEnv = {
  get url() {
    return process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  },
  get publishableKey() {
    return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY;
  },
  get secretKey() {
    return process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get databaseUrl() {
    return process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  },
  get directDatabaseUrl() {
    return process.env.DIRECT_DATABASE_URL ?? process.env.POSTGRES_URL_NON_POOLING ?? process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  },
};

export function isSupabaseConfigured() {
  return Boolean(supabaseEnv.url && supabaseEnv.publishableKey);
}
