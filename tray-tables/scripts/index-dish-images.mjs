/**
 * Scans a folder of dish image files (named: City_Country_DishName_Restaurant.ext)
 * and writes src/data/dish-image-paths.json mapping dish id -> URL under /Images/.
 *
 * Default image dirs (first that exists):
 * 1) public/Images
 * 2) ../Images (e.g. Desktop/Tray Tables/Images)
 *
 * Run after: npm run data:canonical-dishes
 *   npm run data:dish-images
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, "..");

const DISHES = path.join(
  projectRoot,
  "src",
  "data",
  "canonical-dishes-by-slug.json"
);
const OUT = path.join(projectRoot, "src", "data", "dish-image-paths.json");

const EXT = /\.(jpe?g|jpe?g|jfif|avif|png|webp|gif|bmp)$/i;

function norm(s) {
  return String(s)
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function fileStem(basename) {
  return norm(basename.replace(EXT, ""));
}

function canonicalMatchKey(s) {
  return norm(s)
    .toLowerCase()
    .replace(/[''ʼ]/g, "")
    .replace(/_/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function findImageDir() {
  const a = path.join(projectRoot, "public", "Images");
  if (fs.existsSync(a) && fs.statSync(a).isDirectory()) {
    if (fs.readdirSync(a).length > 0) return a;
  }
  const b = path.join(projectRoot, "..", "Images");
  if (fs.existsSync(b) && fs.statSync(b).isDirectory()) return b;
  return a;
}

function allDishesFlat() {
  const raw = JSON.parse(fs.readFileSync(DISHES, "utf8"));
  const bySlug = raw.bySlug;
  if (!bySlug) return [];
  return Object.values(bySlug).flat();
}

function buildStem(d) {
  return norm([d.city, d.country, d.name, d.restaurant].join("_"));
}

function buildIndex() {
  const imageDir = findImageDir();
  if (!fs.existsSync(DISHES)) {
    console.error("Missing", DISHES, "— run: npm run data:canonical-dishes");
    process.exit(1);
  }
  if (!fs.existsSync(imageDir)) {
    console.warn("Image folder missing:", imageDir, "— creating empty index.");
    return { generated: new Date().toISOString(), imageDir, byDishId: {} };
  }

  const files = fs
    .readdirSync(imageDir, { withFileTypes: true })
    .filter((d) => d.isFile() && !d.name.startsWith("."))
    .map((d) => d.name);
  const stems = new Map();
  for (const f of files) {
    stems.set(fileStem(f), f);
  }
  const stemsByCanonical = new Map();
  for (const [st, fn] of stems) {
    const k = canonicalMatchKey(st);
    if (!stemsByCanonical.has(k)) stemsByCanonical.set(k, fn);
  }
  if (stems.size === 0) {
    console.warn("No image files in", imageDir, "— byDishId empty.");
  }

  const dishes = allDishesFlat();
  const byDishId = {};
  let match = 0;
  const normalizeApo = (x) => x.replace(/[''ʼ]/g, "'");
  for (const d of dishes) {
    if (!d.id || !d.city) continue;
    const s = buildStem(d);
    let f = stems.get(s);
    if (!f) {
      const sNorm = normalizeApo(s);
      for (const [st, fn] of stems) {
        if (normalizeApo(st) === sNorm) {
          f = fn;
          break;
        }
      }
    }
    if (!f) {
      f = stemsByCanonical.get(canonicalMatchKey(s));
    }
    if (f) {
      byDishId[d.id] = f;
      match += 1;
    }
  }

  return {
    generated: new Date().toISOString(),
    imageDir,
    matchCount: match,
    byDishId,
  };
}

const index = buildIndex();
fs.writeFileSync(OUT, JSON.stringify(index, null, 2) + "\n", "utf8");
console.log(
  "Wrote",
  OUT,
  "matched",
  index.matchCount ?? 0,
  "of",
  allDishesFlat().length,
  "dishes. Source:",
  index.imageDir
);
