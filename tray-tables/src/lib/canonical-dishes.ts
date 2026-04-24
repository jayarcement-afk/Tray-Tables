import data from "@/data/canonical-dishes-by-slug.json";

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
  const m = (data as { bySlug: Record<string, CsvDish[]> }).bySlug[slug];
  return m ? [...m] : [];
}
