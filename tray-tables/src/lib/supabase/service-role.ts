import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { env, normalizedSupabaseUrl } from "@/lib/env";

/** Admin client for server-side writes (never import in client components). */
export function createSupabaseServiceRoleClient(): SupabaseClient | null {
  const url = normalizedSupabaseUrl(env.supabaseUrl?.trim());
  const key = env.supabaseServiceRoleKey?.trim();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
