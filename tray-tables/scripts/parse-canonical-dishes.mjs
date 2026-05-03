/**
 * Reads the Canonical Dishes xlsx; writes src/data/canonical-dishes-by-slug.json
 * (dishes + restaurants + why + hours tags) keyed by public.cities.slug.
 * Run: node scripts/parse-canonical-dishes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const INPUT = path.join(projectRoot, "data", "canonical-dishes-listed.xlsx");
const OUT = path.join(
  projectRoot,
  "src",
  "data",
  "canonical-dishes-by-slug.json"
);

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
  "barcelona|spain": "barcelona",
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
function resolveSlug(city, country) {
  const ctry = (country && String(country).trim()) || "Unknown";
  const k = keyOf(city, ctry);
  if (SEED_SLUG_ALIASES[k]) return SEED_SLUG_ALIASES[k];
  if (!ctry || ctry === "Unknown") return kebab(city);
  return `${kebab(city)}-${kebab(ctry)}`.replace(/--+/g, "-");
}

/** Strip [n](url) and similar markdown link tails from CSV blurbs */
function cleanWhy(s) {
  if (!s) return "";
  return String(s)
    .replace(/\s*\[(\d+|[^\]]+)\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function hoursToTags(hours) {
  const h = String(hours ?? "").trim();
  if (!h) return [];
  return h
    .split(/[,;]+/)
    .map((p) => p.replace(/\s*&\s*/g, " ").trim())
    .filter(Boolean)
    .map((seg) => {
      const t = seg.split(/\s+/);
      return t
        .map(
          (w) =>
            w.length <= 1
              ? w.toUpperCase()
              : w[0].toUpperCase() + w.slice(1).toLowerCase()
        )
        .join(" ");
    });
}

function idSafe(s) {
  return kebab(s).replace(/-+/g, "-").slice(0, 80) || "x";
}

if (!fs.existsSync(INPUT)) {
  console.error("Missing:", INPUT);
  process.exit(1);
}
const buf = fs.readFileSync(INPUT);
const wb = XLSX.read(buf, { type: "buffer" });
const sh = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sh, { defval: "", raw: false });

const bySlug = new Map();
let idx = 0;
for (const r of rows) {
  const city = String(
    r.City ?? r["\uFEFFCity"] ?? ""
  )
    .replace(/^\uFEFF/, "")
    .trim();
  if (!city || city.toLowerCase() === "city") continue;
  const country = String(r.Country ?? "").trim() || "Unknown";
  const slug = resolveSlug(city, country);
  const name = String(r["Canonical Dish"] ?? "").trim();
  if (!name) continue;
  const restaurant = String(r.Restaurant ?? "").trim();
  const why = cleanWhy(String(r["Why This Place"] ?? ""));
  const hoursRaw = String(r.Hours ?? "").trim();
  const tags = hoursToTags(hoursRaw);
  const id = `${slug}--${idx++}--${idSafe(name + "-" + restaurant)}`.slice(0, 200);

  const rec = {
    id,
    city,
    country,
    name,
    restaurant,
    why,
    imageUrl: String(r["Image"] ?? r["Image URL"] ?? r["Photo"] ?? "")
      .trim() || null,
    price: String(r.Price ?? "").trim(),
    vegetarianOptions: String(r["Vegetarian Options"] ?? "").trim(),
    localFavorite: String(r["Local Favorite"] ?? "").trim(),
    trendy: String(r.Trendy ?? "").trim(),
    streetFood: String(r["Street Food"] ?? "").trim(),
    drinkPairing: String(r["Drink Pairing"] ?? "").trim(),
  };
  const sourceCell = String(
    r.Source ?? r.source ?? r.Sources ?? r.sources ?? ""
  ).trim();
  if (/michelin/i.test(sourceCell)) rec.michelinGuide = true;

  if (!bySlug.has(slug)) bySlug.set(slug, []);
  bySlug.get(slug).push({ ...rec, hours: hoursRaw, tags });
}

const bySlugObject = Object.fromEntries(
  [...bySlug.entries()].sort((a, b) => a[0].localeCompare(b[0]))
);

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(
  OUT,
  JSON.stringify(
    {
      generated: new Date().toISOString(),
      source: "Canonical Dishes Listed (xlsx); dishes keyed by city slug",
      bySlug: bySlugObject,
    },
    null,
    2
  )
);
console.log("Wrote", OUT, "cities with dishes:", Object.keys(bySlugObject).length);
