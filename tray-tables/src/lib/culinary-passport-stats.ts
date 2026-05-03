import type { CsvDish } from "@/lib/canonical-dishes";
import { getCanonicalDishById, getCanonicalDishesForSlug } from "@/lib/canonical-dishes";
import { continentForCountry } from "@/lib/culinary-passport-continents";
import { linkIsMichelinGuide } from "@/lib/michelin-source";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PassportStats = {
  pastTripCount: number;
  uniqueCountries: number;
  uniqueContinents: number;
  /** Distinct restaurants from dishes logged on **completed** (past) trips, every city/trip combined. */
  restaurantsDinedCount: number;
  customDishPastCount: number;
  reviewRowPastCount: number;
  reviewsRated4PlusPast: number;
  vegetarianTaggedRestaurantCount: number;
  michelinLinkedRestaurantCount: number;
  tastingMenuDishCount: number;
  /** Dish cards (logged on past trips) whose pairing/tags/title suggest wine; used for “Wine pairing pro”. */
  winePairedDishCount: number;
  lateNightRestaurantCount: number;
  streetFoodRestaurantCount: number;
  localFavoriteRestaurantCount: number;
  /** Longest run of calendar days with ≥1 meal log (custom dish or review row) across all trips. */
  mealLogStreakDays: number;
  /**
   * Trip `cities.slug` for each **past** trip (ended before today). Used for city passport stamps:
   * visiting that city on a completed trip unlocks the stamp (same scope as “Past trips” on /trips).
   */
  dinedCitySlugs: string[];
};

const USER_DISH_PREFIX = "user-dish-";

function uuidFromUserDishId(dishId: string): string | null {
  if (!dishId.startsWith(USER_DISH_PREFIX)) return null;
  const raw = dishId.slice(USER_DISH_PREFIX.length).trim().toLowerCase();
  if (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(raw)
  ) {
    return raw;
  }
  return null;
}

type CityEmbed = { country?: string | null; slug?: string | null };

type TripRow = {
  id: string;
  end_date: string;
  cities?: CityEmbed | CityEmbed[] | null;
};

function tripCity(t: TripRow): CityEmbed | null {
  const c = t.cities;
  if (!c) return null;
  if (Array.isArray(c)) return c[0] ?? null;
  return c;
}

function restaurantKey(restaurant: string, country: string): string {
  return `${restaurant.trim().toLowerCase()}|${country.trim().toLowerCase()}`;
}

/** Canonical dish card: explicit seed flag or Michelin Guide listing URL. */
function csvDishCountsForMichelin(d: CsvDish): boolean {
  if (d.michelinGuide === true) return true;
  return linkIsMichelinGuide(d.linkUrl);
}

/** Custom dish row: DB tag and/or guide URL. */
function customRowCountsForMichelin(c: {
  tag_michelin_guide?: boolean | null;
  link_url: string | null;
}): boolean {
  if (c.tag_michelin_guide) return true;
  return linkIsMichelinGuide(c.link_url);
}

function isVegetarianCsv(d: CsvDish): boolean {
  const t = d.vegetarianOptions.trim().toLowerCase();
  return t === "yes" || t === "limited";
}

function isCsvYes(v: string): boolean {
  return v.trim().toLowerCase() === "yes";
}

/**
 * True if free text looks like a wine pairing / wine type / sparkling note on a dish card.
 * Matches “wine”, common grapes/styles, and Champagne-style words even when “wine” is omitted.
 */
function wineMentionedInText(raw: string): boolean {
  const s = raw.trim().toLowerCase();
  if (!s || s === "n/a") return false;
  if (s.includes("wine")) return true;

  const hints = [
    "champagne",
    "prosecco",
    "cava",
    "sparkling",
    "crémant",
    "cremant",
    "lambrusco",
    "riesling",
    "chardonnay",
    "cabernet",
    "merlot",
    "pinot noir",
    "pinot grigio",
    "pinot gris",
    "sauvignon",
    "syrah",
    "shiraz",
    "malbec",
    "tempranillo",
    "nebbiolo",
    "sangiovese",
    "gamay",
    "zinfandel",
    "viognier",
    "gewürztraminer",
    "gewurztraminer",
    "moscato",
    "albariño",
    "albarino",
    "chenin",
    "bordeaux",
    "burgundy",
    "loire",
    "rioja",
    "chianti",
    "barolo",
    "barbaresco",
    "chablis",
    "sauternes",
    "tokaji",
    "rhône",
    "rhone",
    "douro",
    "madeira",
    "vermouth",
    "marsala",
  ];
  for (const h of hints) {
    const t = h.trim().toLowerCase();
    if (t.length >= 4 && s.includes(t)) return true;
  }

  const wordBoundaryShort = ["port", "sherry"];
  for (const w of wordBoundaryShort) {
    if (new RegExp(`\\b${w}\\b`, "i").test(raw)) return true;
  }
  return false;
}

function csvDishSuggestsWine(d: CsvDish): boolean {
  if (wineMentionedInText(d.drinkPairing)) return true;
  if (d.tags.some((tag) => wineMentionedInText(tag))) return true;
  if (wineMentionedInText(d.name)) return true;
  return false;
}

function customRowSuggestsWine(c: {
  drink_pairing: string | null;
  dish_name: string | null;
}): boolean {
  return (
    wineMentionedInText(String(c.drink_pairing ?? "")) ||
    wineMentionedInText(String(c.dish_name ?? ""))
  );
}

function dishLateNight(d: CsvDish): boolean {
  const h = d.hours.toLowerCase();
  const tags = d.tags.map((x) => x.toLowerCase());
  return h.includes("late") || tags.some((t) => t.includes("late"));
}

function dishTastingMenu(d: CsvDish): boolean {
  return d.name.toLowerCase().includes("tasting menu");
}

function longestConsecutiveDayStreak(dates: Set<string>): number {
  if (dates.size === 0) return 0;
  const sorted = [...dates].sort();
  let best = 1;
  let run = 1;
  for (let i = 1; i < sorted.length; i++) {
    const a = new Date(sorted[i - 1]! + "T12:00:00Z").getTime();
    const b = new Date(sorted[i]! + "T12:00:00Z").getTime();
    if ((b - a) / 86_400_000 === 1) {
      run += 1;
      best = Math.max(best, run);
    } else {
      run = 1;
    }
  }
  return best;
}

const emptyStats: PassportStats = {
  pastTripCount: 0,
  uniqueCountries: 0,
  uniqueContinents: 0,
  restaurantsDinedCount: 0,
  customDishPastCount: 0,
  reviewRowPastCount: 0,
  reviewsRated4PlusPast: 0,
  vegetarianTaggedRestaurantCount: 0,
  michelinLinkedRestaurantCount: 0,
  tastingMenuDishCount: 0,
  winePairedDishCount: 0,
  lateNightRestaurantCount: 0,
  streetFoodRestaurantCount: 0,
  localFavoriteRestaurantCount: 0,
  mealLogStreakDays: 0,
  dinedCitySlugs: [],
};

/**
 * Stats for the culinary passport. Trip counts / countries / city stamps use **past** trips only.
 * Restaurant totals and dish-derived badges use **past trips only** so the cover reflects completed travel
 * across every finished trip and city (not upcoming itineraries).
 */
export async function loadPassportStats(
  supabase: SupabaseClient,
  userId: string
): Promise<PassportStats> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: tripsRaw, error: tripsErr } = await supabase
    .from("trips")
    .select(
      `
      id,
      end_date,
      cities (
        country,
        slug
      )
    `
    )
    .eq("user_id", userId);

  if (tripsErr) return { ...emptyStats };

  const allTrips = (tripsRaw ?? []) as TripRow[];
  const past = allTrips.filter((t) => t.end_date < today);
  const pastTripIds = past.map((t) => t.id);
  const tripById = new Map(allTrips.map((t) => [t.id, t]));

  const countries = new Set(
    past.map((t) => (tripCity(t)?.country ?? "").trim()).filter(Boolean)
  );
  const continents = new Set(
    [...countries].map((c) => continentForCountry(c)).filter((x) => x !== "Other")
  );

  if (allTrips.length === 0) {
    return { ...emptyStats };
  }

  type CustomDishRow = {
    id: string;
    trip_id: string;
    restaurant: string | null;
    link_url: string | null;
    drink_pairing: string | null;
    dish_name: string | null;
    meal_slots: string[] | null;
    tag_vegetarian_options: boolean | null;
    tag_street_food: boolean | null;
    tag_local_favorite: boolean | null;
    tag_michelin_guide: boolean | null;
    created_at: string | null;
  };
  type ReviewRow = {
    trip_id: string;
    dish_id: string;
    rating: number | null;
    created_at: string | null;
    updated_at: string | null;
  };

  let customList: CustomDishRow[] = [];
  let reviews: ReviewRow[] = [];

  if (pastTripIds.length > 0) {
    const [customRes, reviewRes] = await Promise.all([
      supabase
        .from("trip_custom_dishes")
        .select(
          "id, trip_id, restaurant, link_url, drink_pairing, dish_name, meal_slots, tag_vegetarian_options, tag_street_food, tag_local_favorite, tag_michelin_guide, created_at"
        )
        .in("trip_id", pastTripIds),
      supabase
        .from("trip_dish_reviews")
        .select("trip_id, dish_id, rating, created_at, updated_at")
        .in("trip_id", pastTripIds),
    ]);
    if (customRes.error || reviewRes.error) {
      return { ...emptyStats };
    }
    customList = (customRes.data ?? []) as CustomDishRow[];
    reviews = (reviewRes.data ?? []) as ReviewRow[];
  }

  const customByTripUuid = new Map<string, CustomDishRow>();
  for (const c of customList) {
    const idKey = String(c.id).trim().toLowerCase();
    customByTripUuid.set(`${c.trip_id}:${idKey}`, c);
  }

  const slugDishMaps = new Map<string, Map<string, CsvDish>>();
  const slugs = new Set(
    past.map((t) => (tripCity(t)?.slug ?? "").trim()).filter(Boolean)
  );
  for (const slug of slugs) {
    const dishes = getCanonicalDishesForSlug(slug);
    slugDishMaps.set(slug, new Map(dishes.map((d) => [d.id, d])));
  }

  const restaurantKeys = new Set<string>();
  const vegetarianKeys = new Set<string>();
  const michelinKeys = new Set<string>();
  const tastingMenuCount = { n: 0 };
  let winePairingDishCount = 0;
  const lateNightKeys = new Set<string>();
  const streetFoodKeys = new Set<string>();
  const localFavoriteKeys = new Set<string>();
  const logDays = new Set<string>();

  const addKey = (set: Set<string>, trip: TripRow, restaurant: string) => {
    const country = (tripCity(trip)?.country ?? "").trim() || "unknown";
    set.add(restaurantKey(restaurant, country));
  };

  for (const c of customList) {
    const trip = tripById.get(c.trip_id);
    if (!trip) continue;
    const r = String(c.restaurant ?? "").trim() || "Restaurant";
    restaurantKeys.add(restaurantKey(r, (tripCity(trip)?.country ?? "").trim() || "unknown"));

    if (c.tag_vegetarian_options) addKey(vegetarianKeys, trip, r);
    if (c.tag_street_food) addKey(streetFoodKeys, trip, r);
    if (c.tag_local_favorite) addKey(localFavoriteKeys, trip, r);
    if (customRowSuggestsWine(c)) winePairingDishCount += 1;
    const slots = Array.isArray(c.meal_slots) ? c.meal_slots : [];
    if (slots.includes("late_night")) {
      addKey(lateNightKeys, trip, r);
    }
    const cd =
      typeof c.created_at === "string" && c.created_at.length >= 10
        ? c.created_at.slice(0, 10)
        : null;
    if (cd) logDays.add(cd);
    if (customRowCountsForMichelin(c)) addKey(michelinKeys, trip, r);
    const dn = String(c.dish_name ?? "").toLowerCase();
    if (dn.includes("tasting menu")) tastingMenuCount.n += 1;
  }

  let reviewRowPastCount = 0;
  let reviewsRated4PlusPast = 0;

  for (const rev of reviews) {
    const trip = tripById.get(rev.trip_id);
    if (!trip) continue;
    const rating = Number(rev.rating);
    const dishId = String(rev.dish_id ?? "");
    const tripSlug = (tripCity(trip)?.slug ?? "").trim();
    const day =
      (typeof rev.updated_at === "string" && rev.updated_at.slice(0, 10)) ||
      (typeof rev.created_at === "string" && rev.created_at.slice(0, 10)) ||
      null;
    if (day) logDays.add(day);

    const uuid = uuidFromUserDishId(dishId);
    if (uuid) {
      const row = customByTripUuid.get(`${rev.trip_id}:${uuid.toLowerCase()}`);
      if (row) {
        const rname = String(row.restaurant ?? "").trim() || "Restaurant";
        const country = (tripCity(trip)?.country ?? "").trim() || "unknown";
        restaurantKeys.add(restaurantKey(rname, country));
      }
    } else {
      const dm = tripSlug ? slugDishMaps.get(tripSlug) : undefined;
      const dish = dm?.get(dishId) ?? getCanonicalDishById(dishId);
      if (dish) {
        restaurantKeys.add(restaurantKey(dish.restaurant, dish.country));
        if (isVegetarianCsv(dish)) addKey(vegetarianKeys, trip, dish.restaurant);
        if (isCsvYes(dish.streetFood)) addKey(streetFoodKeys, trip, dish.restaurant);
        if (isCsvYes(dish.localFavorite)) addKey(localFavoriteKeys, trip, dish.restaurant);
        if (csvDishSuggestsWine(dish)) winePairingDishCount += 1;
        if (dishLateNight(dish)) addKey(lateNightKeys, trip, dish.restaurant);
        if (csvDishCountsForMichelin(dish)) addKey(michelinKeys, trip, dish.restaurant);
        if (dishTastingMenu(dish)) tastingMenuCount.n += 1;
      }
    }

    if (Number.isFinite(rating) && rating >= 1) reviewRowPastCount += 1;
    if (Number.isFinite(rating) && rating >= 4) reviewsRated4PlusPast += 1;
  }

  const dinedCitySlugs = new Set<string>();
  for (const trip of past) {
    const slug = (tripCity(trip)?.slug ?? "").trim();
    if (!slug) continue;
    dinedCitySlugs.add(slug);
  }

  return {
    pastTripCount: past.length,
    uniqueCountries: countries.size,
    uniqueContinents: continents.size,
    restaurantsDinedCount: restaurantKeys.size,
    customDishPastCount: customList.length,
    reviewRowPastCount,
    reviewsRated4PlusPast,
    vegetarianTaggedRestaurantCount: vegetarianKeys.size,
    michelinLinkedRestaurantCount: michelinKeys.size,
    tastingMenuDishCount: tastingMenuCount.n,
    winePairedDishCount: winePairingDishCount,
    lateNightRestaurantCount: lateNightKeys.size,
    streetFoodRestaurantCount: streetFoodKeys.size,
    localFavoriteRestaurantCount: localFavoriteKeys.size,
    mealLogStreakDays: longestConsecutiveDayStreak(logDays),
    dinedCitySlugs: [...dinedCitySlugs],
  };
}
