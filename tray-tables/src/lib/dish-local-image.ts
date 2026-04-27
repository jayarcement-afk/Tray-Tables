import paths from "@/data/dish-image-paths.json";
import type { CsvDish } from "@/lib/canonical-dishes";

type Index = {
  byDishId: Record<string, string>;
};

const index = paths as Index;
const byId = index.byDishId ?? {};
const bySuffix = new Map<string, string[]>();

for (const id of Object.keys(byId)) {
  const suffix = id.match(/(--\d+--.+)$/)?.[1];
  if (!suffix) continue;
  const list = bySuffix.get(suffix) ?? [];
  list.push(id);
  bySuffix.set(suffix, list);
}

function toSlug(value: string): string {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[''ʼ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function filenameForDishIdWithFallback(dish: CsvDish): string | null {
  const direct = byId[dish.id];
  if (direct) return direct;

  // Some datasets may include country in city slug (e.g. bangkok-thailand--327--...).
  // Try matching by stable suffix (--numeric-id--dish-slug) and then city slug.
  const suffix = dish.id.match(/(--\d+--.+)$/)?.[1];
  if (!suffix) return null;

  const citySlug = toSlug(dish.city);
  const cityScopedId = `${citySlug}${suffix}`;
  if (byId[cityScopedId]) return byId[cityScopedId];

  const candidates = bySuffix.get(suffix) ?? [];
  if (candidates.length === 1) return byId[candidates[0]] ?? null;

  const cityMatch = candidates.find((id) => id.startsWith(`${citySlug}--`));
  if (cityMatch) return byId[cityMatch] ?? null;

  return null;
}

/**
 * Public URL for a file in /public/Images (served as /Images/...).
 * Filename is stored as in the folder; we encode for special characters in URLs.
 */
export function publicImageUrlForFilename(filename: string): string {
  return `/Images/${encodeURIComponent(filename)}`;
}

/** Local image from the Images folder when index has a file for this dish id. */
export function getLocalDishImageUrl(dish: CsvDish): string | null {
  const fn = filenameForDishIdWithFallback(dish);
  if (!fn) return null;
  return publicImageUrlForFilename(fn);
}

/**
 * Prefer a file in /public/Images; otherwise the spreadsheet image URL, if any.
 */
export function resolveDishImageUrl(dish: CsvDish): string | null {
  return getLocalDishImageUrl(dish) ?? (dish.imageUrl?.trim() || null);
}
