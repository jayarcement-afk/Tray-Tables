import type { CsvDish } from "@/lib/canonical-dishes";
import { linkIsMichelinGuide } from "@/lib/michelin-source";

export const USER_DISH_ID_PREFIX = "user-dish-";

export function isUserAddedDishId(id: string): boolean {
  return id.startsWith(USER_DISH_ID_PREFIX);
}

/** Stable localStorage key for one-time migration → Supabase after deploy. */
export function tripCustomDishesLegacyLocalKey(tripId: string): string {
  return `trip-custom-dishes:${tripId}`;
}

/** Read-only: legacy payloads before server-backed storage. */
export function loadLegacyTripCustomDishesFromLocalStorage(tripId: string): CsvDish[] {
  try {
    const raw = window.localStorage.getItem(tripCustomDishesLegacyLocalKey(tripId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CsvDish =>
        Boolean(item && typeof item === "object" && typeof (item as CsvDish).id === "string")
    );
  } catch {
    return [];
  }
}

export function clearLegacyTripCustomDishesLocalStorage(tripId: string): void {
  try {
    window.localStorage.removeItem(tripCustomDishesLegacyLocalKey(tripId));
  } catch {
    // ignore
  }
}

export function uuidFromUserDishClientId(clientId: string): string | null {
  if (!clientId.startsWith(USER_DISH_ID_PREFIX)) return null;
  const raw = clientId.slice(USER_DISH_ID_PREFIX.length).trim().toLowerCase();
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw)
  ) {
    return raw;
  }
  return null;
}

export function dishPrimaryExternalHref(dish: CsvDish): string {
  const sanitized = dish.linkUrl?.trim() ? sanitizeHttpUrl(dish.linkUrl) : null;
  if (sanitized) return sanitized;
  const addr = dish.address?.trim();
  const q = addr
    ? [dish.restaurant, addr, dish.city, dish.country].filter(Boolean).join(", ")
    : [dish.restaurant, dish.city, dish.country].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/**
 * If the user pasted a Google Maps link with coordinates, use them on the trip map
 * without calling the geocoder (Nominatim often misses exact storefronts).
 */
export function coordsFromMapsLinkUrl(
  raw: string | null | undefined
): { lat: number; lon: number } | null {
  const u = raw?.trim();
  if (!u) return null;
  const sanitized = sanitizeHttpUrl(u);
  if (!sanitized) return null;
  let url: URL;
  try {
    url = new URL(sanitized);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!host.includes("google.") && !host.includes("goo.gl")) return null;

  const text = url.href;

  const atMatch = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:\b|[,/z]|\s|$)/.exec(text);
  if (atMatch) {
    const lat = Number(atMatch[1]);
    const lon = Number(atMatch[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  const ll = url.searchParams.get("ll");
  if (ll) {
    const parts = ll.split(",").map((x) => x.trim());
    if (parts.length >= 2) {
      const lat = Number(parts[0]);
      const lon = Number(parts[1]);
      if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
        return { lat, lon };
      }
    }
  }

  const m3d = /[!?&/]3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/i.exec(text);
  if (m3d) {
    const lat = Number(m3d[1]);
    const lon = Number(m3d[2]);
    if (Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180) {
      return { lat, lon };
    }
  }

  return null;
}

/** Geocode string for the trip map (include restaurant + street when address is set). */
export function mapGeocodeQueryForDish(d: CsvDish): string {
  const addr = d.address?.trim();
  const city = d.city?.trim() ?? "";
  const country = d.country?.trim() ?? "";
  if (addr) {
    return [d.restaurant?.trim() ?? "", addr, city, country].filter(Boolean).join(", ");
  }
  return [d.restaurant?.trim() ?? "", city, country].filter(Boolean).join(", ");
}

/**
 * Extra Nominatim attempts for user-added stops when the primary string fails
 * (free-form addresses and long queries often 404; restaurant + trip city usually hits).
 *
 * Pass the trip page `cityName` / `cityCountry` so fallbacks still work if `d.city`/`d.country`
 * on the row are empty or out of sync with the trip banner.
 */
export function mapExtraGeocodeQueriesForDish(
  d: CsvDish,
  tripCityName?: string,
  tripCountryName?: string
): string[] {
  if (!isUserAddedDishId(d.id)) return [];
  const primary = mapGeocodeQueryForDish(d);
  const city = d.city?.trim() ?? "";
  const country = d.country?.trim() ?? "";
  const r = d.restaurant?.trim() ?? "";
  const addr = d.address?.trim() ?? "";
  const tripCity = tripCityName?.trim() ?? "";
  const tripCountry = tripCountryName?.trim() ?? "";
  const tripAnchor = [tripCity, tripCountry].filter(Boolean).join(", ");

  const out: string[] = [];
  const push = (q: string) => {
    const t = q.trim();
    if (!t || t === primary) return;
    if (!out.includes(t)) out.push(t);
  };

  if (tripAnchor) {
    push(tripAnchor);
    if (addr) push([addr, tripAnchor].join(", "));
  }
  push([r, city, country].filter(Boolean).join(", "));
  if (addr) push([addr, city, country].filter(Boolean).join(", "));
  push([city, country].filter(Boolean).join(", "));
  return out;
}

/**
 * Map dedupe key: user-added rows use dish id so every custom stop geocodes separately;
 * canonical rows keep restaurant|city|country (optional |address when present).
 */
export function mapPointKeyForDish(d: CsvDish): string {
  if (isUserAddedDishId(d.id)) return d.id;
  const a = (d.address ?? "").trim();
  const base = [d.restaurant, d.city, d.country].join("|");
  return a ? `${base}|${a}` : base;
}

export function sanitizeHttpUrl(raw: string): string | null {
  const u = raw.trim();
  if (!u) return null;
  let parsed: URL;
  try {
    parsed = new URL(u);
  } catch {
    return null;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
  return parsed.href;
}

const MEAL_HOURS_LABEL: Record<"breakfast" | "lunch" | "dinner" | "late_night", string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  late_night: "Late night",
};

export type MealSlotKey = keyof typeof MEAL_HOURS_LABEL;

/** Canonical order for arrays and display. */
export const MEAL_SLOT_ORDER: MealSlotKey[] = ["breakfast", "lunch", "dinner", "late_night"];

export function sortMealSlotsKeys(slots: MealSlotKey[]): MealSlotKey[] {
  const set = new Set(slots);
  return MEAL_SLOT_ORDER.filter((k) => set.has(k));
}

/** API GET/POST camelCase payloads. */
export type TripCustomDishApi = {
  id: string;
  dishName: string;
  restaurant: string;
  linkUrl: string | null;
  why: string;
  drinkPairing: string;
  /** Which meal slots this stop applies to (non-empty, sorted). */
  mealSlots: MealSlotKey[];
  localFavorite: boolean;
  trendy: boolean;
  streetFood: boolean;
  vegetarianOptions: boolean;
  /** Michelin Guide listing (DB tag or inferred from guide.michelin.com link). */
  michelinGuide: boolean;
  imageSignedUrl: string | null;
  /** Street address for map search (optional). */
  address: string | null;
};

export function tripCustomDishesApiToCsv(
  list: TripCustomDishApi[],
  city: string,
  country: string
): CsvDish[] {
  return list.map((d) => {
    const slots = sortMealSlotsKeys(d.mealSlots.length ? d.mealSlots : ["lunch"]);
    const hourLabels = slots.map((k) => MEAL_HOURS_LABEL[k]);
    const hoursLabel = hourLabels.join(" / ");
    return {
      id: `${USER_DISH_ID_PREFIX}${d.id}`,
      city,
      country,
      name: d.dishName,
      restaurant: d.restaurant,
      why: d.why,
      imageUrl: d.imageSignedUrl,
      hours: hoursLabel,
      tags: hourLabels,
      price: "N/A",
      vegetarianOptions: d.vegetarianOptions ? "Yes" : "No",
      localFavorite: d.localFavorite ? "Yes" : "No",
      trendy: d.trendy ? "Yes" : "No",
      streetFood: d.streetFood ? "Yes" : "No",
      drinkPairing: d.drinkPairing,
      linkUrl: d.linkUrl,
      address: d.address?.trim() ? d.address.trim() : null,
      michelinGuide: d.michelinGuide,
    };
  });
}

export function vegetarianTagFromCsvRaw(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t === "yes" || t === "limited";
}

function mealSlotKeyFromCsvDish(d: CsvDish): MealSlotKey {
  const h = d.hours.trim().toLowerCase();
  if (h === "breakfast") return "breakfast";
  if (h === "lunch") return "lunch";
  if (h === "dinner") return "dinner";
  if (h === "late night" || h === "late_night") return "late_night";
  const tag = (d.tags[0] ?? "").trim().toLowerCase();
  if (tag.includes("breakfast")) return "breakfast";
  if (tag.includes("lunch")) return "lunch";
  if (tag.includes("dinner")) return "dinner";
  if (tag.includes("late")) return "late_night";
  return "lunch";
}

function lineToMealSlotKey(s: string): MealSlotKey | null {
  const t = s.trim().toLowerCase();
  if (!t) return null;
  if (t.includes("late")) return "late_night";
  if (t.includes("breakfast")) return "breakfast";
  if (t.includes("lunch")) return "lunch";
  if (t.includes("dinner")) return "dinner";
  return null;
}

/** Infer multiple slots from legacy CSV/local rows (tags + hours). */
export function mealSlotsFromLegacyCsvDish(d: CsvDish): MealSlotKey[] {
  const found = new Set<MealSlotKey>();
  const slotFromHours = lineToMealSlotKey(d.hours);
  if (slotFromHours) found.add(slotFromHours);
  for (const tag of d.tags) {
    const slot = lineToMealSlotKey(tag);
    if (slot) found.add(slot);
  }
  const ordered = MEAL_SLOT_ORDER.filter((k) => found.has(k));
  return ordered.length > 0 ? ordered : [mealSlotKeyFromCsvDish(d)];
}

export async function fetchTripCustomDishes(
  tripId: string,
  cityName: string,
  country: string
): Promise<CsvDish[]> {
  const res = await fetch(`/api/trips/${tripId}/custom-dishes`);
  const json = (await res.json()) as { dishes?: TripCustomDishApi[]; error?: string };
  if (!res.ok) throw new Error(json.error ?? "Could not load your trip dishes.");
  const list = Array.isArray(json.dishes) ? json.dishes : [];
  return tripCustomDishesApiToCsv(list, cityName, country);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Load from API; if empty, upload legacy localStorage rows once then reload. */
export async function fetchTripCustomDishesWithOptionalMigrate(
  tripId: string,
  cityName: string,
  country: string
): Promise<CsvDish[]> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await sleep(250 * attempt);
    try {
      let customs = await fetchTripCustomDishes(tripId, cityName, country);
      if (customs.length === 0) {
        const legacy = loadLegacyTripCustomDishesFromLocalStorage(tripId);
        if (legacy.length > 0) {
          await migrateLegacyTripCustomDishesOnce(tripId, cityName, country, legacy);
          customs = await fetchTripCustomDishes(tripId, cityName, country);
        }
      }
      return customs;
    } catch (e) {
      lastError = e;
    }
  }
  if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    console.warn("[trip-custom-dishes] load failed after retries:", lastError);
  }
  return [];
}

/** Best-effort: POST each legacy dish, then clears localStorage for this trip. */
export async function migrateLegacyTripCustomDishesOnce(
  tripId: string,
  cityName: string,
  country: string,
  legacy: CsvDish[]
): Promise<void> {
  if (!legacy.length) return;
  let ok = true;
  for (const dish of legacy) {
    try {
      const fd = new FormData();
      const mealSlots = mealSlotsFromLegacyCsvDish(dish);
      fd.append(
        "payload",
        JSON.stringify({
          restaurant: dish.restaurant,
          dishName: dish.name,
          linkUrl: dish.linkUrl ?? "",
          address: dish.address?.trim() ?? "",
          why: dish.why,
          drinkPairing: dish.drinkPairing,
          mealSlots,
          localFavorite: (dish.localFavorite ?? "").trim().toLowerCase() === "yes",
          trendy: (dish.trendy ?? "").trim().toLowerCase() === "yes",
          streetFood: (dish.streetFood ?? "").trim().toLowerCase() === "yes",
          vegetarianOptions: vegetarianTagFromCsvRaw(dish.vegetarianOptions),
          michelinGuide: Boolean(dish.michelinGuide) || linkIsMichelinGuide(dish.linkUrl),
        })
      );
      if (dish.imageUrl?.trim().startsWith("data:image/")) {
        const blob = await fetch(dish.imageUrl).then((r) => r.blob());
        fd.append("image", blob, "dish.jpg");
      }
      const res = await fetch(`/api/trips/${tripId}/custom-dishes`, {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        ok = false;
        break;
      }
    } catch {
      ok = false;
      break;
    }
  }
  if (ok) clearLegacyTripCustomDishesLocalStorage(tripId);
}
