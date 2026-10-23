import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_KEY, SUPABASE_URL, authConfigured } from "./env";

let client: SupabaseClient | null = null;

/** Browser client, or null when Supabase is not connected. */
export function getBrowserClient(): SupabaseClient | null {
  if (!authConfigured) return null;
  client ??= createBrowserClient(SUPABASE_URL!, SUPABASE_KEY!);
  return client;
}
