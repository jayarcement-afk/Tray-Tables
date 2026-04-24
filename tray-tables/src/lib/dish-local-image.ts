import paths from "@/data/dish-image-paths.json";
import type { CsvDish } from "@/lib/canonical-dishes";

type Index = {
  byDishId: Record<string, string>;
};

const index = paths as Index;

/**
 * Public URL for a file in /public/Images (served as /Images/...).
 * Filename is stored as in the folder; we encode for special characters in URLs.
 */
export function publicImageUrlForFilename(filename: string): string {
  return `/Images/${encodeURIComponent(filename)}`;
}

/** Local image from the Images folder when index has a file for this dish id. */
export function getLocalDishImageUrl(dish: CsvDish): string | null {
  const fn = index.byDishId?.[dish.id];
  if (!fn) return null;
  return publicImageUrlForFilename(fn);
}

/**
 * Prefer a file in /public/Images; otherwise the spreadsheet image URL, if any.
 */
export function resolveDishImageUrl(dish: CsvDish): string | null {
  return getLocalDishImageUrl(dish) ?? (dish.imageUrl?.trim() || null);
}
