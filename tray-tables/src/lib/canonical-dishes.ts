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
  /** User-entered listing URL; when set, the dish card uses this instead of Google Maps. */
  linkUrl?: string | null;
  /** User-entered street address (custom dishes); improves trip map geocoding. */
  address?: string | null;
  /** When true (from DB tag or seed data), counts toward Michelin passport achievements even without a guide URL on the card. */
  michelinGuide?: boolean | null;
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

let canonicalDishByIdCache: Map<string, CsvDish> | null = null;
let allCanonicalDishesCache: CsvDish[] | null = null;

/** All canonical dishes (flat); cached. Used by quiz pool without re-importing JSON elsewhere. */
export function getAllCanonicalDishes(): CsvDish[] {
  if (!allCanonicalDishesCache) {
    const bySlug = (data as { bySlug: Record<string, CsvDish[]> }).bySlug;
    allCanonicalDishesCache = Object.values(bySlug).flat();
  }
  return allCanonicalDishesCache;
}

/** Resolve a canonical dish id across all cities (for stats / pins when trip slug mismatches). */
export function getCanonicalDishById(dishId: string | null | undefined): CsvDish | null {
  if (!dishId) return null;
  if (!canonicalDishByIdCache) {
    const bySlug = (data as { bySlug: Record<string, CsvDish[]> }).bySlug;
    const m = new Map<string, CsvDish>();
    for (const dishes of Object.values(bySlug)) {
      for (const d of dishes) {
        m.set(d.id, d);
      }
    }
    canonicalDishByIdCache = m;
  }
  return canonicalDishByIdCache.get(dishId) ?? null;
}
