import data from "@/data/canonical-dishes-by-slug.json";

/** When `cities.slug` was deduped (e.g. `barcelona`) but static JSON still uses the old key. */
const CANONICAL_DISH_SLUG_FALLBACK: Record<string, string> = {
  barcelona: "barcelona-spain",
};

export type CsvDish = {
  id: string;
  city: string;
  country: string;
  name: string;
  restaurant: string;
  why: string;
  imageUrl: string | null;
  hours: string;
  tags: string[];
  /** Raw Price cell, e.g. $, $$, $$$, €€, or N/A */
  price: string;
  /** Raw "Vegetarian Options" cell */
  vegetarianOptions: string;
  localFavorite: string;
  trendy: string;
  streetFood: string;
  drinkPairing: string;
};

export function getCanonicalDishesForSlug(
  slug: string | null | undefined
): CsvDish[] {
  if (!slug) return [];
  const bySlug = (data as { bySlug: Record<string, CsvDish[]> }).bySlug;
  const primary = bySlug[slug];
  if (primary && primary.length > 0) return [...primary];
  const alt = CANONICAL_DISH_SLUG_FALLBACK[slug];
  if (alt) {
    const fb = bySlug[alt];
    if (fb && fb.length > 0) return [...fb];
  }
  return [];
}
