import type { CsvDish } from "@/lib/canonical-dishes";
import { getCanonicalDishById } from "@/lib/canonical-dishes";

/** Slim module for the quiz check API only — avoids pulling fs + dish-local-image into that bundle. */

export function labelForDish(d: CsvDish): string {
  return `${d.city.trim()}, ${d.country.trim()}`.replace(/\s+/g, " ");
}

export function normalizeLocationLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

export function checkGuessDishCountryAnswer(
  dishId: string,
  selectedLabel: string
): { correct: boolean; correctLabel: string; dishName: string } | null {
  const dish = getCanonicalDishById(dishId);
  if (!dish) return null;
  const correctLabel = labelForDish(dish);
  const correct =
    normalizeLocationLabel(selectedLabel) === normalizeLocationLabel(correctLabel);
  const dishName = dish.name.trim() || "Unknown dish";
  return { correct, correctLabel, dishName };
}
