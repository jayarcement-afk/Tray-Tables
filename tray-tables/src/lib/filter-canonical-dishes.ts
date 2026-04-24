import type { CsvDish } from "@/lib/canonical-dishes";
import { countPriceSymbols } from "@/lib/price-tier";

export type PriceFilterTier = 1 | 2 | 3;

/** When on, drop rows where Vegetarian Options is Limited or No (case-insensitive). */
export function isVegetarianFilterPass(
  dish: CsvDish,
  vegetarianOnly: boolean
): boolean {
  if (!vegetarianOnly) return true;
  const v = dish.vegetarianOptions.trim().toLowerCase();
  if (v === "limited" || v === "no") return false;
  return true;
}

/**
 * - Tier 1: only dishes with exactly 1 currency symbol in Price.
 * - Tier 2: 1 or 2 symbols.
 * - Tier 3: all (including 0 = unparseable / text-only price).
 */
export function isPriceFilterPass(
  dish: CsvDish,
  tier: PriceFilterTier
): boolean {
  const n = countPriceSymbols(dish.price);
  if (tier === 3) return true;
  if (tier === 2) return n >= 1 && n <= 2;
  return n === 1;
}

export function filterCanonicalDishes(
  dishes: CsvDish[],
  vegetarianOnly: boolean,
  priceTier: PriceFilterTier
): CsvDish[] {
  return dishes.filter(
    (d) =>
      isVegetarianFilterPass(d, vegetarianOnly) &&
      isPriceFilterPass(d, priceTier)
  );
}
