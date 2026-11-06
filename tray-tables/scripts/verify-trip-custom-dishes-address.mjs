/**
 * Verifies Supabase exposes `trip_custom_dishes.address` (migration applied).
 *
 * Usage (from tray-tables/):
 *   node --env-file=.env.local scripts/verify-trip-custom-dishes-address.mjs
 *
 * Requires:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY  (bypasses RLS; safe for local dev checks only)
 */

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!url) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL.\nTry: node --env-file=.env.local scripts/verify-trip-custom-dishes-address.mjs"
  );
  process.exit(1);
}
if (!serviceKey) {
  console.error(
    "Missing SUPABASE_SERVICE_ROLE_KEY (needed to read rows regardless of RLS).\nTry: node --env-file=.env.local scripts/verify-trip-custom-dishes-address.mjs"
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await supabase
  .from("trip_custom_dishes")
  .select("id, trip_id, restaurant, address")
  .limit(5);

if (error) {
  const msg = error.message ?? String(error);
  console.error("Query failed:", msg);
  if (/address|column|does not exist|schema cache/i.test(msg)) {
    console.error(
      "\nLikely fix: run data/sql/add-address-to-trip-custom-dishes.sql in the Supabase SQL editor, then wait a few seconds for the API schema cache to refresh."
    );
  }
  process.exit(1);
}

console.log("OK: `address` column is readable on public.trip_custom_dishes.");
console.log("Sample (up to 5 rows):");
console.log(JSON.stringify(data, null, 2));
