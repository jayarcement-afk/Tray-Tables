import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { env } from "@/lib/env";

/** Returns null when public Supabase env is missing (e.g. CI/Vercel misconfiguration) so prerender does not throw. */
export function createSupabaseBrowserClient(): SupabaseClient | null {
  const url = env.supabaseUrl?.trim();
  const key = env.supabaseAnonKey?.trim();
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}

