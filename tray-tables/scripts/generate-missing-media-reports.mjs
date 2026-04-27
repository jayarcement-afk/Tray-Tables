import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const DISHES = path.join(projectRoot, "src", "data", "canonical-dishes-by-slug.json");
const CITIES = path.join(projectRoot, "src", "data", "canonical-cities.json");
const IMAGE_INDEX = path.join(projectRoot, "src", "data", "dish-image-paths.json");
const CITY_BANNERS = path.join(projectRoot, "src", "lib", "city-banners.ts");

const OUT_DIR = path.join(projectRoot, "data", "reports");
const OUT_DISH = path.join(OUT_DIR, "missing-dish-images.csv");
const OUT_CITY = path.join(OUT_DIR, "missing-city-banners.csv");

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function norm(s) {
  return String(s ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim();
}

function toSlugPiece(s) {
  return norm(s)
    .toLowerCase()
    .replace(/[''ʼ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function expectedFilename(d) {
  return `${norm(d.city)}_${norm(d.country)}_${norm(d.name)}_${norm(d.restaurant)}.jpg`;
}

function csvEscape(v) {
  const s = String(v ?? "");
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function writeCsv(file, headers, rows) {
  const lines = [
    headers.join(","),
    ...rows.map((row) => headers.map((h) => csvEscape(row[h])).join(",")),
  ];
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${lines.join("\n")}\n`, "utf8");
}

function parseBannerKeys(fileContent) {
  const keys = new Set();
  const re = /^\s*(?:"([^"]+)"|([a-zA-Z0-9_-]+))\s*:\s*\{/gm;
  let m;
  while ((m = re.exec(fileContent))) {
    const key = m[1] || m[2];
    if (key) keys.add(key);
  }
  return keys;
}

function allDishes() {
  const data = readJson(DISHES);
  return Object.values(data.bySlug ?? {}).flat();
}

function main() {
  const dishes = allDishes();
  const imageMap = readJson(IMAGE_INDEX).byDishId ?? {};
  const missingDishes = dishes
    .filter((d) => !imageMap[d.id])
    .map((d) => ({
      id: d.id,
      city: d.city,
      country: d.country,
      slug: `${toSlugPiece(d.city)}-${toSlugPiece(d.country)}`,
      dish_name: d.name,
      restaurant: d.restaurant,
      expected_filename: expectedFilename(d),
      search_query: `${d.city} ${d.name} ${d.restaurant}`,
      source_url: "",
      source_notes: "",
    }));

  const cities = readJson(CITIES).cities ?? [];
  const bannerKeys = parseBannerKeys(fs.readFileSync(CITY_BANNERS, "utf8"));
  const missingCities = cities
    .filter((c) => {
      const slug = String(c.slug ?? "");
      const base = slug.split("-")[0];
      return !bannerKeys.has(slug) && !bannerKeys.has(base);
    })
    .map((c) => ({
      slug: c.slug,
      city: c.name,
      country: c.country,
      search_query: `${c.name} ${c.country} skyline`,
      image_url: "",
      attribution: "",
      source_notes: "",
    }));

  writeCsv(
    OUT_DISH,
    [
      "id",
      "city",
      "country",
      "slug",
      "dish_name",
      "restaurant",
      "expected_filename",
      "search_query",
      "source_url",
      "source_notes",
    ],
    missingDishes
  );

  writeCsv(
    OUT_CITY,
    [
      "slug",
      "city",
      "country",
      "search_query",
      "image_url",
      "attribution",
      "source_notes",
    ],
    missingCities
  );

  console.log(
    `Wrote ${OUT_DISH} (${missingDishes.length} missing dish images) and ${OUT_CITY} (${missingCities.length} missing city banners).`
  );
}

main();
