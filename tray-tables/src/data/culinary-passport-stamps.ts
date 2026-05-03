import type { PassportStats } from "@/lib/culinary-passport-stats";

/**
 * Accent colors when a stamp is unlocked (by achievement `number`, stable across sessions).
 * Human spec lives at repo root: `Achivements Tray Tables.pages` (Pages) and/or `Achivements Tray Tables.docx` (Word export for diffable XML). Replace `CULINARY_PASSPORT_STAMPS_RAW` when the spec changes.
 */
export const STAMP_ACTIVE_COLORS = [
  "#1d4ed8",
  "#047857",
  "#b91c1c",
  "#c2410c",
  "#6d28d9",
  "#0d9488",
  "#be185d",
  "#a16207",
  "#4338ca",
  "#15803d",
  "#b45309",
  "#0e7490",
  "#a21caf",
  "#4d7c0f",
  "#9a3412",
  "#0369a1",
] as const;

export type StampRule =
  | { kind: "past_trips"; min: number }
  | { kind: "countries"; min: number }
  | { kind: "continents"; min: number }
  | { kind: "restaurants"; min: number }
  /** City stamp: user had a **past** trip (completed) whose `cities.slug` matches. */
  | { kind: "city_dined"; slug: string }
  | { kind: "vegetarian_restaurants"; min: number }
  | { kind: "michelin_restaurants"; min: number }
  | { kind: "tasting_menus"; min: number }
  | { kind: "wine_restaurants"; min: number }
  | { kind: "late_night_restaurants"; min: number }
  | { kind: "street_food_restaurants"; min: number }
  | { kind: "local_favorite_restaurants"; min: number }
  | { kind: "meal_streak"; min: number }
  | { kind: "all"; rules: StampRule[] }
  | { kind: "any"; rules: StampRule[] };

export type PassportStampDef = {
  number: number;
  name: string;
  rule: StampRule;
};

function evalRule(rule: StampRule, s: PassportStats): boolean {
  switch (rule.kind) {
    case "past_trips":
      return s.pastTripCount >= rule.min;
    case "countries":
      return s.uniqueCountries >= rule.min;
    case "continents":
      return s.uniqueContinents >= rule.min;
    case "restaurants":
      return s.restaurantsDinedCount >= rule.min;
    case "city_dined":
      return s.dinedCitySlugs.includes(rule.slug);
    case "vegetarian_restaurants":
      return s.vegetarianTaggedRestaurantCount >= rule.min;
    case "michelin_restaurants":
      return s.michelinLinkedRestaurantCount >= rule.min;
    case "tasting_menus":
      return s.tastingMenuDishCount >= rule.min;
    case "wine_restaurants":
      return s.winePairedDishCount >= rule.min;
    case "late_night_restaurants":
      return s.lateNightRestaurantCount >= rule.min;
    case "street_food_restaurants":
      return s.streetFoodRestaurantCount >= rule.min;
    case "local_favorite_restaurants":
      return s.localFavoriteRestaurantCount >= rule.min;
    case "meal_streak":
      return s.mealLogStreakDays >= rule.min;
    case "all":
      return rule.rules.every((r) => evalRule(r, s));
    case "any":
      return rule.rules.some((r) => evalRule(r, s));
    default:
      return false;
  }
}

export function isStampUnlocked(stamp: PassportStampDef, stats: PassportStats): boolean {
  return evalRule(stamp.rule, stats);
}

export function activeColorForStamp(number: number): string {
  const idx = (number - 1) % STAMP_ACTIVE_COLORS.length;
  return STAMP_ACTIVE_COLORS[idx]!;
}

/**
 * Achievement list from the achievements spec (ordered by `number` 1–32); see `STAMP_ACTIVE_COLORS` comment for `.pages` / `.docx` paths.
 * Rule column typos in an older Word export (#7 “Barcelon”, #9 “banco”, #30/#32 “country” for continent stamps, #18 rule says 10 restaurants vs title 1) are corrected here in `rule` only; names match the spec where the name column is unambiguous.
 */
const CULINARY_PASSPORT_STAMPS_RAW: PassportStampDef[] = [
  { number: 1, name: "First stamp (visited 1 country)", rule: { kind: "countries", min: 1 } },
  { number: 2, name: "First restaurant logged", rule: { kind: "restaurants", min: 1 } },
  {
    number: 3,
    name: "Street food master – Mexico City",
    rule: { kind: "city_dined", slug: "mexico-city" },
  },
  { number: 4, name: "Sushi pilgrim – Tokyo", rule: { kind: "city_dined", slug: "tokyo" } },
  {
    number: 5,
    name: "Fine dining connoisseur – Paris",
    rule: { kind: "city_dined", slug: "paris" },
  },
  { number: 6, name: "Pasta purist – Rome", rule: { kind: "city_dined", slug: "rome-italy" } },
  {
    number: 7,
    name: "Tapas crawler – Barcelona",
    rule: { kind: "city_dined", slug: "barcelona" },
  },
  { number: 8, name: "BBQ explorer – Austin", rule: { kind: "city_dined", slug: "austin" } },
  {
    number: 9,
    name: "Night market hunter – Bangkok",
    rule: { kind: "city_dined", slug: "bangkok" },
  },
  {
    number: 10,
    name: "Dim sum devotee – Hong Kong",
    rule: { kind: "city_dined", slug: "hong-kong-china" },
  },
  { number: 11, name: "3 countries explored", rule: { kind: "countries", min: 3 } },
  { number: 12, name: "10 restaurants visited", rule: { kind: "restaurants", min: 10 } },
  { number: 13, name: "5 countries explored", rule: { kind: "countries", min: 5 } },
  { number: 14, name: "25 restaurants visited", rule: { kind: "restaurants", min: 25 } },
  { number: 15, name: "10 countries explored", rule: { kind: "countries", min: 10 } },
  { number: 16, name: "50 restaurants visited", rule: { kind: "restaurants", min: 50 } },
  {
    number: 17,
    name: "Vegetarian explorer (10 veg meals logged)",
    rule: { kind: "vegetarian_restaurants", min: 10 },
  },
  {
    number: 18,
    name: "Michelin hunter (visited 1 Michelin recommended restaurant)",
    rule: { kind: "michelin_restaurants", min: 1 },
  },
  {
    number: 19,
    name: "3 Michelin restaurants visited",
    rule: { kind: "michelin_restaurants", min: 3 },
  },
  { number: 20, name: "3 continents explored", rule: { kind: "continents", min: 3 } },
  {
    number: 21,
    name: "Wine pairing pro (5 dishes with wine pairing listed)",
    rule: { kind: "wine_restaurants", min: 5 },
  },
  {
    number: 22,
    name: "Late night eater",
    rule: { kind: "late_night_restaurants", min: 5 },
  },
  {
    number: 23,
    name: "Street food lover",
    rule: { kind: "street_food_restaurants", min: 5 },
  },
  {
    number: 24,
    name: "Local favorite (visited 5 non-touristy spots)",
    rule: { kind: "local_favorite_restaurants", min: 5 },
  },
  {
    number: 25,
    name: "“Passport streak” (logged meals 7 days in a row)",
    rule: { kind: "meal_streak", min: 7 },
  },
  { number: 26, name: "20 countries explored", rule: { kind: "countries", min: 20 } },
  { number: 27, name: "100 restaurants visited", rule: { kind: "restaurants", min: 100 } },
  {
    number: 28,
    name: "Tasting menu experience (completed 3 tasting menus)",
    rule: { kind: "tasting_menus", min: 3 },
  },
  { number: 29, name: "250 restaurants visited", rule: { kind: "restaurants", min: 250 } },
  { number: 30, name: "5 continents explored", rule: { kind: "continents", min: 5 } },
  { number: 31, name: "500 restaurants visited", rule: { kind: "restaurants", min: 500 } },
  {
    number: 32,
    name: "Global explorer (6+ continents)",
    rule: { kind: "continents", min: 6 },
  },
];

export const CULINARY_PASSPORT_STAMPS = [...CULINARY_PASSPORT_STAMPS_RAW].sort(
  (a, b) => a.number - b.number
);

export const PASSPORT_STAMPS_PER_PAGE = 6;
export const PASSPORT_VISA_PAGE_COUNT = 6;
