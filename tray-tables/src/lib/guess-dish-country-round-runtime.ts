/**
 * Quiz round API uses only this module + slim JSON — no dish-local-image / fs.
 */
import quizPoolJson from "@/data/quiz-dish-pool.generated.json";
import { normalizeLocationLabel } from "@/lib/guess-dish-country-check";

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

export type GuessDishCountryRound = {
  dishId: string;
  imageUrl: string;
  choices: string[];
};

type PoolEntry = {
  id: string;
  imageUrl: string;
  city: string;
  country: string;
  name: string;
};

function poolEntries(): PoolEntry[] {
  const raw = quizPoolJson as { dishes?: PoolEntry[] };
  return Array.isArray(raw.dishes) ? raw.dishes : [];
}

function label(e: PoolEntry): string {
  return `${e.city.trim()}, ${e.country.trim()}`.replace(/\s+/g, " ");
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildGuessDishCountryRound(
  excludeDishId?: string | null
): GuessDishCountryRound | null {
  const pool = poolEntries();
  if (pool.length === 0) return null;

  let candidates = pool;
  if (excludeDishId) {
    const filtered = pool.filter((d) => d.id !== excludeDishId);
    if (filtered.length > 0) candidates = filtered;
  }

  const dish = candidates[Math.floor(Math.random() * candidates.length)]!;
  const correct = label(dish);
  const wrongLabels: string[] = [];
  const used = new Set<string>([normalizeLocationLabel(correct)]);

  for (const d of shuffle(pool.filter((x) => x.id !== dish.id))) {
    if (wrongLabels.length >= 3) break;
    const lbl = label(d);
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
  const imageUrl = dish.imageUrl?.trim();
  if (!imageUrl) return null;

  return {
    dishId: dish.id,
    imageUrl,
    choices,
  };
}
