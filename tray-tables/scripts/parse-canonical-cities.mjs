/**
 * Reads the Canonical Dishes spreadsheet (xlsx) and writes:
 * - src/data/canonical-cities.json
 * - data/sql/seed-canonical-cities.sql
 * Run: node scripts/parse-canonical-cities.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const DEFAULT_IN = path.join(
  projectRoot,
  "data",
  "canonical-dishes-listed.xlsx"
);
const outJson = path.join(
  projectRoot,
  "src",
  "data",
  "canonical-cities.json"
);
const outSql = path.join(
  projectRoot,
  "data",
  "sql",
  "seed-canonical-cities.sql"
);

/** Slugs in public.cities (seed.sql) that differ from "city-country" kebab. */
const SEED_SLUG_ALIASES = {
  "new york city|united states": "new-york-city",
  "chicago|united states": "chicago",
  "atlanta|united states": "atlanta",
  "austin|united states": "austin",
  "tokyo|japan": "tokyo",
  "paris|france": "paris",
  "mexico city|mexico": "mexico-city",
  "bangkok|thailand": "bangkok",
  "seoul|south korea": "seoul",
};

function keyOf(name, country) {
  return `${String(name).trim().toLowerCase()}|${String(country)
    .trim()
    .toLowerCase()}`;
}

function kebab(s) {
  return s
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function resolveSlug(name, country) {
  const k = keyOf(name, country);
  if (SEED_SLUG_ALIASES[k]) return SEED_SLUG_ALIASES[k];
  const c = country && country !== "Unknown" ? country : "";
  if (!c) return kebab(name);
  return `${kebab(name)}-${kebab(c)}`.replace(/--+/g, "-");
}

const input = process.argv[2] || DEFAULT_IN;
if (!fs.existsSync(input)) {
  console.error("Missing file:", input);
  process.exit(1);
}

const buf = fs.readFileSync(input);
const wb = XLSX.read(buf, { type: "buffer" });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: "", raw: false });

const byKey = new Map();
for (const r of rows) {
  const firstCol = r.City ?? r["\uFEFFCity"];
  const city = String(firstCol ?? Object.values(r)[0] ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/^\u200B+/, "")
    .trim();
  const country = String(
    r.Country ?? (typeof r.Country === "string" ? r.Country : "")
  )
    .replace(/^\uFEFF/, "")
    .trim();
  if (!city || city.toLowerCase() === "city") continue;
  const ctry = country || "Unknown";
  const key = `${city}|${ctry}`;
  if (byKey.has(key)) continue;
  byKey.set(key, { name: city, country: ctry });
}

const list = [...byKey.values()]
  .map((r) => ({
    name: r.name,
    country: r.country,
    slug: resolveSlug(r.name, r.country),
  }))
  .sort((a, b) =>
    a.name.toLowerCase() === b.name.toLowerCase()
      ? a.country.localeCompare(b.country)
      : a.name.localeCompare(b.name)
  );

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(
  outJson,
  JSON.stringify(
    { generated: new Date().toISOString(), count: list.length, cities: list },
    null,
    2
  )
);
console.log("Wrote", outJson, "count", list.length);

function esc(t) {
  if (t == null) return "null";
  return `E'${String(t).replace(/\\/g, "\\\\").replace(/'/g, "''")}'`;
}

const values = list
  .map(
    (c) =>
      `  (${esc(c.name)}, ${esc(
        c.country
      )}, null, ${esc(c.slug)}::text)`
  )
  .join(",\n");

const sql = `-- Run once in the Supabase SQL editor.
-- From Canonical Dishes Listed; upserts by slug. Dish seed is separate.
-- Generated: scripts/parse-canonical-cities.mjs
insert into public.cities (name, country, region, slug)
values
${values}
on conflict (slug) do update set
  name = excluded.name,
  country = excluded.country;
`;

fs.mkdirSync(path.dirname(outSql), { recursive: true });
fs.writeFileSync(outSql, sql);
console.log("Wrote", outSql);
