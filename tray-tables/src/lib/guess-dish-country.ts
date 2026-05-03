import fs from "node:fs";
import path from "node:path";

import data from "@/data/canonical-dishes-by-slug.json";

import type { CsvDish } from "@/lib/canonical-dishes";
import { getCanonicalDishById } from "@/lib/canonical-dishes";
import { resolveDishImageUrl } from "@/lib/dish-local-image";

/** Typed distractors when the image pool has too few unique locations. */
const FALLBACK_LOCATIONS = [
  "Paris, France",
  "Tokyo, Japan",
  "Mexico City, Mexico",
  "Bangkok, Thailand",
  "Barcelona, Spain",
  "Rome, Italy",
  "Istanbul, Turkey",
  "London, United Kingdom",
  "Singapore, Singapore",
  "Sydney, Australia",
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function labelForDish(d: CsvDish): string {
  return `${d.city.trim()}, ${d.country.trim()}`.replace(/\s+/g, " ");
}

export function normalizeLocationLabel(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/** Avoid the DishPhoto placeholder graphic (`/dish-fallback.jpeg`) and obvious placeholder URLs. */
function isPlaceholderOrFallbackImageUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  if (!u) return true;
  if (u.includes("dish-fallback")) return true;
  if (u.includes("placehold.co")) return true;
  return false;
}

/**
 * For `/Images/…` and `/imported-dish-images/…` assets, require the file to exist under `public/`.
 * Missing files 404 in the browser and `DishPhoto` swaps in the “image not available” fallback.
 */
function localPublicImageFileExists(pathname: string): boolean {
  const p = pathname.trim();
  if (!p.startsWith("/")) return false;
  const segments = p.split("/").filter(Boolean);
  if (segments.length < 2) return false;
  const root = segments[0]?.toLowerCase();
  if (root !== "images" && root !== "imported-dish-images") return false;
  const abs = path.join(process.cwd(), "public", ...segments.map((s) => decodeURIComponent(s)));
  try {
    const st = fs.statSync(abs);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

/** True when this resolved URL should actually load (not empty, not placeholder, local file exists if applicable). */
export function resolvedImageUrlOkForQuiz(url: string | null | undefined): boolean {
  const u = url?.trim() ?? "";
  if (!u) return false;
  if (isPlaceholderOrFallbackImageUrl(u)) return false;
  if (u.startsWith("data:image/")) return true;

  if (u.startsWith("/")) {
    return localPublicImageFileExists(u);
  }

  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const parsed = new URL(u);
      const pn = parsed.pathname;
      if (pn.startsWith("/Images/") || pn.startsWith("/imported-dish-images/")) {
        return localPublicImageFileExists(pn);
      }
      // Remote spreadsheet URLs — cannot sync-verify; keep in pool (same as dish cards).
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

/** Dishes whose primary image exists locally when applicable (avoids fallback overlay in the quiz). */
export function getQuizImagePool(): CsvDish[] {
  const bySlug = (data as { bySlug: Record<string, CsvDish[]> }).bySlug;
  const all = Object.values(bySlug).flat();
  return all.filter((d) => {
    const url = resolveDishImageUrl(d);
    return resolvedImageUrlOkForQuiz(url);
  });
}

export type GuessDishCountryRound = {
  dishId: string;
  imageUrl: string;
  choices: string[];
};

/**
 * One quiz round: random dish with an image, four shuffled location labels (city, country).
 * @param excludeDishId — avoid repeating the same dish when possible (e.g. after “Next”).
 */
export function buildGuessDishCountryRound(
  excludeDishId?: string | null
): GuessDishCountryRound | null {
  const pool = getQuizImagePool();
  if (pool.length === 0) return null;

  let candidates = pool;
  if (excludeDishId) {
    const filtered = pool.filter((d) => d.id !== excludeDishId);
    if (filtered.length > 0) candidates = filtered;
  }

  const dish = candidates[Math.floor(Math.random() * candidates.length)]!;
  const correct = labelForDish(dish);
  const wrongLabels: string[] = [];
  const used = new Set<string>([normalizeLocationLabel(correct)]);

  for (const d of shuffle(pool.filter((x) => x.id !== dish.id))) {
    if (wrongLabels.length >= 3) break;
    const lbl = labelForDish(d);
    const n = normalizeLocationLabel(lbl);
    if (!used.has(n)) {
      used.add(n);
      wrongLabels.push(lbl);
    }
  }

  for (const fb of shuffle([...FALLBACK_LOCATIONS])) {
    if (wrongLabels.length >= 3) break;
    const n = normalizeLocationLabel(fb);
    if (!used.has(n)) {
      used.add(n);
      wrongLabels.push(fb);
    }
  }

  while (wrongLabels.length < 3) {
    wrongLabels.push(`Place ${wrongLabels.length + 1}, World`);
  }

  const choices = shuffle([correct, ...wrongLabels.slice(0, 3)]);
  const imageUrl = resolveDishImageUrl(dish);
  if (!imageUrl?.trim()) return null;

  return {
    dishId: dish.id,
    imageUrl,
    choices,
  };
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
