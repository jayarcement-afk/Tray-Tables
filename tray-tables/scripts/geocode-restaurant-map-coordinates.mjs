/**
 * Batch-geocode unique "restaurant, city, country" strings from canonical dishes
 * and upsert into Supabase public.restaurant_map_coordinates.
 *
 * Requires (in .env.local or environment):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Nominatim policy: ~1 request / second — script pauses 1100ms between calls.
 *
 * Usage:
 *   node scripts/geocode-restaurant-map-coordinates.mjs
 *   node scripts/geocode-restaurant-map-coordinates.mjs --limit=50
 *   node scripts/geocode-restaurant-map-coordinates.mjs --skip-existing
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const DISHES_JSON = path.join(projectRoot, "src", "data", "canonical-dishes-by-slug.json");
const QUERY_KEY_MAX = 500;
const NOMINATIM_UA = "TrayTables/1.0 (batch geocode restaurant map cache)";
const PAUSE_MS = 1100;

function loadEnvLocal() {
  const p = path.join(projectRoot, ".env.local");
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq <= 0) continue;
    const k = t.slice(0, eq).trim();
    let v = t.slice(eq + 1).trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!process.env[k]) process.env[k] = v;
  }
}

function parseArgs() {
  let limit = Infinity;
  let skipExisting = false;
  for (const a of process.argv.slice(2)) {
    if (a.startsWith("--limit=")) limit = Math.max(1, Number(a.slice("--limit=".length)) || 1);
    if (a === "--skip-existing") skipExisting = true;
  }
  return { limit, skipExisting };
}

function dishQuery(d) {
  const parts = [d.restaurant, d.city, d.country].filter(Boolean).map((s) => String(s).trim());
  return parts.join(", ");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function nominatim(q) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { headers: { "User-Agent": NOMINATIM_UA } });
  if (res.status === 429) {
    await sleep(2000);
    return fetch(url, { headers: { "User-Agent": NOMINATIM_UA } });
  }
  return res;
}

async function main() {
  loadEnvLocal();
  const { limit, skipExisting } = parseArgs();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!supabaseUrl || !serviceKey) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(DISHES_JSON, "utf8"));
  const bySlug = raw.bySlug ?? {};
  const all = Object.values(bySlug).flat();

  const queries = new Set();
  for (const d of all) {
    const q = dishQuery(d);
    if (q.length > 0) queries.add(q.slice(0, QUERY_KEY_MAX));
  }
  let list = [...queries];
  console.log(`Unique geocode strings: ${list.length}`);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  if (skipExisting) {
    const { data: existing, error } = await admin.from("restaurant_map_coordinates").select("query_key");
    if (error) {
      console.error("Could not read restaurant_map_coordinates:", error.message);
      process.exit(1);
    }
    const have = new Set((existing ?? []).map((r) => r.query_key));
    list = list.filter((q) => !have.has(q));
    console.log(`After --skip-existing: ${list.length} to geocode`);
  }

  if (Number.isFinite(limit)) {
    list = list.slice(0, limit);
    console.log(`Applying --limit: ${list.length} rows`);
  }

  let ok = 0;
  let miss = 0;
  let i = 0;
  for (const q of list) {
    i += 1;
    const queryKey = q.slice(0, QUERY_KEY_MAX);
    if (i > 1) await sleep(PAUSE_MS);

    const res = await nominatim(q);
    if (!res.ok) {
      console.warn(`[${i}/${list.length}] HTTP ${res.status} ${q.slice(0, 60)}…`);
      miss += 1;
      continue;
    }
    const rows = await res.json();
    const row = rows[0];
    if (!row) {
      console.warn(`[${i}/${list.length}] not found: ${q.slice(0, 60)}…`);
      miss += 1;
      continue;
    }
    const lat = Number(row.lat);
    const lon = Number(row.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      miss += 1;
      continue;
    }

    const { error: upErr } = await admin.from("restaurant_map_coordinates").upsert(
      {
        query_key: queryKey,
        lat,
        lon,
        source: "nominatim",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "query_key" }
    );
    if (upErr) {
      console.error(`[${i}/${list.length}] upsert failed:`, upErr.message);
      miss += 1;
      continue;
    }
    ok += 1;
    if (ok % 25 === 0) console.log(`… ${ok} saved`);
  }

  console.log(`Done. Saved: ${ok}, missed/failed: ${miss}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
