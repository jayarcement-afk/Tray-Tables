/**
 * Generates src/data/reused-dish-images-by-name.generated.json
 *
 * Goal: for dishes with missing/placeholder images, reuse a real LOCAL image
 * (either /Images/* or /imported-dish-images/*) from another dish with the
 * same name, preferring the same country when possible.
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getAllCanonicalDishes } from "../src/lib/canonical-dishes";
import { resolveDishImageUrl } from "../src/lib/dish-local-image";

type Out = {
  generated: string;
  byName: Record<string, string>;
  byNameCountry: Record<string, string>;
};

function normalizeKey(value: string): string {
  return String(value ?? "")
    .normalize("NFKC")
    .trim()
    .toLowerCase()
    .replace(/[''ʼ]/g, "")
    .replace(/\s+/g, " ");
}

function isPlaceholderOrFallbackImageUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  if (u.includes("dish-fallback")) return true;
  if (u.includes("placehold.co")) return true;
  if (u.includes("via.placeholder")) return true;
  if (u.includes("dummyimage")) return true;
  if (u.includes("picsum.photos")) return true;
  return false;
}

function isLocalDishImage(url: string): boolean {
  const u = url.trim();
  return u.startsWith("/Images/") || u.startsWith("/imported-dish-images/");
}

function keyForNameCountry(name: string, country: string): string {
  return `${normalizeKey(name)}|||${normalizeKey(country)}`;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "src/data/reused-dish-images-by-name.generated.json");

const all = getAllCanonicalDishes();

// Donor pool: dishes that already resolve to a real local image.
const donorsByName: Map<string, { url: string; country: string }[]> = new Map();
for (const d of all) {
  const url = resolveDishImageUrl(d);
  if (!url) continue;
  if (isPlaceholderOrFallbackImageUrl(url)) continue;
  if (!isLocalDishImage(url)) continue;

  const nk = normalizeKey(d.name);
  const list = donorsByName.get(nk) ?? [];
  list.push({ url, country: d.country });
  donorsByName.set(nk, list);
}

const byName: Record<string, string> = {};
const byNameCountry: Record<string, string> = {};

for (const d of all) {
  const current = resolveDishImageUrl(d);
  if (current && !isPlaceholderOrFallbackImageUrl(current)) continue;

  const nk = normalizeKey(d.name);
  const donors = donorsByName.get(nk) ?? [];
  if (donors.length === 0) continue;

  // Prefer same-country donor if present.
  const sameCountry = donors.find((x) => normalizeKey(x.country) === normalizeKey(d.country));
  if (sameCountry) {
    byNameCountry[keyForNameCountry(d.name, d.country)] = sameCountry.url;
    continue;
  }

  // Otherwise only reuse when unambiguous (single donor globally for that name).
  if (donors.length === 1) {
    byName[nk] = donors[0]!.url;
  }
}

const out: Out = {
  generated: new Date().toISOString(),
  byName,
  byNameCountry,
};

writeFileSync(outPath, JSON.stringify(out, null, 2), "utf8");
console.log(
  "Wrote reused-dish-images-by-name:",
  outPath,
  "byName:",
  Object.keys(byName).length,
  "byNameCountry:",
  Object.keys(byNameCountry).length
);

