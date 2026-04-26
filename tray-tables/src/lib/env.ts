export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  disclaimerVersion: process.env.DISCLAIMER_VERSION ?? "v1-2026-04-09",
} as const;

export function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Supabase URL must be the project origin (e.g. https://xyz.supabase.co).
 * If an env value includes /auth/v1 or /rest/v1, normalize to origin.
 */
export function normalizedSupabaseUrl(value: string): string | null {
  if (!isValidHttpUrl(value)) return null;
  const url = new URL(value);
  return `${url.protocol}//${url.host}`;
}

export function assertEnv() {
  const missing: string[] = [];
  if (!env.supabaseUrl) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!env.supabaseAnonKey) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (missing.length) {
    throw new Error(`Missing env vars: ${missing.join(", ")}`);
  }
}

