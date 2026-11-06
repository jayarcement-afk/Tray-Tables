/**
 * Generates src/data/reused-dish-images-by-name.generated.json
 *
 * For dishes with missing/placeholder images, reuse a real image from another
 * dish with the same name (preferring the same country when possible).
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { getAllCanonicalDishes } from "../src/lib/canonical-dishes";
import { resolveDishImageUrlFromSourcesOnly } from "../src/lib/dish-local-image";

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

function keyForNameCountry(name: string, country: string): string {
  return `${normalizeKey(name)}|||${normalizeKey(country)}`;
}

/** Deterministic pick when several cities share the same dish name. */
function pickDonorUrl(donors: { url: string }[]): string {
  const sorted = [...donors].sort((a, b) => {
    const tier = (u: string) =>
      u.includes("/imported-dish-images/")
        ? 0
        : u.startsWith("/Images/")
          ? 1
          : 2;
    const diff = tier(a.url) - tier(b.url);
    if (diff !== 0) return diff;
    return a.url.localeCompare(b.url);
  });
  return sorted[0]!.url;
}

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const outPath = path.join(root, "src/data/reused-dish-images-by-name.generated.json");

const all = getAllCanonicalDishes();

const donorsByName: Map<string, { url: string; country: string }[]> = new Map();
for (const d of all) {
  const url = resolveDishImageUrlFromSourcesOnly(d);
  if (!url || isPlaceholderOrFallbackImageUrl(url)) continue;

  const nk = normalizeKey(d.name);
  const list = donorsByName.get(nk) ?? [];
  list.push({ url, country: d.country });
  donorsByName.set(nk, list);
}

const byName: Record<string, string> = {};
const byNameCountry: Record<string, string> = {};

for (const d of all) {
  if (resolveDishImageUrlFromSourcesOnly(d)) continue;

  const nk = normalizeKey(d.name);
  const donors = donorsByName.get(nk) ?? [];
  if (donors.length === 0) continue;

  const countryKey = normalizeKey(d.country);
  const sameCountry = donors.filter(
    (x) => normalizeKey(x.country) === countryKey
  );
  if (sameCountry.length > 0) {
    byNameCountry[keyForNameCountry(d.name, d.country)] = pickDonorUrl(sameCountry);
    continue;
  }

  byName[nk] = pickDonorUrl(donors);
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
