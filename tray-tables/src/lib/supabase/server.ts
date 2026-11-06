import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

import { env, normalizedSupabaseUrl } from "@/lib/env";

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();
  const url = normalizedSupabaseUrl(env.supabaseUrl?.trim());
  const key = env.supabaseAnonKey?.trim();

  // Keep client construction safe even when deployment env vars are malformed.
  const safeUrl = url ?? "https://example.invalid";
  const safeKey = key || "invalid-anon-key";

  return createServerClient(safeUrl, safeKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component; cookies are set by middleware/route handlers.
        }
      },
    },
  });
}

