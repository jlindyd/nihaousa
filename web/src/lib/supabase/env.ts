/*
 * Supabase settings. Both values are public by design (they ship to the browser);
 * what protects the data is the row-level security in supabase/schema.sql.
 * Each variable must be written out in full for Next.js to include it in the browser build.
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** False until a Supabase project is connected. The site works without it, just without sign-in. */
export const authConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);
