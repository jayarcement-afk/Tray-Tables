/**
 * Heavy quiz-round logic (canonical JSON iteration + dish-local-image + fs).
 * Loaded only via dynamic import from guess-dish-country-round-gateway so the
 * API route’s main bundle stays small on Vercel.
 */
import fs from "node:fs";
import path from "node:path";

import type { CsvDish } from "@/lib/canonical-dishes";
import { getAllCanonicalDishes } from "@/lib/canonical-dishes";
import { resolveDishImageUrl } from "@/lib/dish-local-image";
import { labelForDish, normalizeLocationLabel } from "@/lib/guess-dish-country-check";

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

/** Quiz only uses real files under `public/Images` or `public/imported-dish-images` (uploaded/indexed assets). */
function resolvedImageUrlOkForQuiz(url: string | null | undefined): boolean {
  const u = url?.trim() ?? "";
  if (!u) return false;
  if (isPlaceholderOrFallbackImageUrl(u)) return false;
  // No remote-only spreadsheet URLs or data URLs — they often 404 or hit DishPhoto fallback.

  if (u.startsWith("/Images/") || u.startsWith("/imported-dish-images/")) {
    return localPublicImageFileExists(u);
  }

  if (u.startsWith("http://") || u.startsWith("https://")) {
    try {
      const pn = new URL(u).pathname;
      if (pn.startsWith("/Images/") || pn.startsWith("/imported-dish-images/")) {
        return localPublicImageFileExists(pn);
      }
    } catch {
      return false;
    }
    return false;
  }

  return false;
}

function getQuizImagePool(): CsvDish[] {
  const all = getAllCanonicalDishes();
  return all.filter((d) => {
    const url = resolveDishImageUrl(d);
    return resolvedImageUrlOkForQuiz(url);
  });
}

/** Build-time only: serializes the quiz pool for `quiz-dish-pool.generated.json`. */
export type QuizPoolSerializedEntry = {
  id: string;
  imageUrl: string;
  city: string;
  country: string;
  name: string;
};

export function serializeQuizPoolForStatic(): QuizPoolSerializedEntry[] {
  return getQuizImagePool().map((d) => ({
    id: d.id,
    imageUrl: resolveDishImageUrl(d)!,
    city: d.city,
    country: d.country,
    name: d.name,
  }));
}

export type GuessDishCountryRound = {
  dishId: string;
  imageUrl: string;
  choices: string[];
};

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
