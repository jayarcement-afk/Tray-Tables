import paths from "@/data/dish-image-paths.json";
import type { CsvDish } from "@/lib/canonical-dishes";

type Index = {
  byDishId: Record<string, string>;
};

const index = paths as Index;
const byId = index.byDishId ?? {};
const bySuffix = new Map<string, string[]>();

for (const id of Object.keys(byId)) {
  const suffix = id.match(/(--\d+--.+)$/)?.[1];
  if (!suffix) continue;
  const list = bySuffix.get(suffix) ?? [];
  list.push(id);
  bySuffix.set(suffix, list);
}

/** Static assets in /public/imported-dish-images (not scanned by dish-image-paths). */
const IMPORTED_DISH_IMAGES_BY_ID: Record<string, string> = {
  "barcelona-spain--97--patatas-bravas-bar-tom-s":
    "/imported-dish-images/barcelona-patatas-bravas.png",
  "barcelona-spain--98--iberian-ham-paco-meralgo":
    "/imported-dish-images/barcelona-iberian-ham.png",
  "barcelona-spain--99--bombas-la-cova-fumada":
    "/imported-dish-images/barcelona-bombas.png",
  "barcelona-spain--100--pan-con-tomate-can-culleretes":
    "/imported-dish-images/barcelona-pan-con-tomate.png",
  "barcelona-spain--101--seafood-rice-arroz-negro-xiringuito-escrib":
    "/imported-dish-images/barcelona-seafood-rice-arroz-negro.png",
  "barcelona-spain--102--boquerones-en-vinagre-el-xampanyet":
    "/imported-dish-images/barcelona-boquerones-en-vinagre.png",
  "barcelona-spain--103--fideu-can-maj":
    "/imported-dish-images/barcelona-fideua.png",
  "barcelona-spain--104--croquetas-sensi-tapas":
    "/imported-dish-images/barcelona-croquetas.png",
  "barcelona-spain--105--crema-catalana-granja-dulcinea":
    "/imported-dish-images/barcelona-crema-catalana.png",
  "barcelona-spain--1226--tapas-quimet-y-quimet":
    "/imported-dish-images/barcelona-tapas.png",
  "barcelona-spain--1227--pintxos-blai-tonight":
    "/imported-dish-images/barcelona-pintxos.png",
  "barcelona-spain--1228--esqueixada-can-culleretes":
    "/imported-dish-images/barcelona-esqueixada.png",
  "barcelona-spain--1229--tortilla-de-patatas-la-pubilla":
    "/imported-dish-images/barcelona-tortilla-de-patatas.png",
  "barcelona-spain--1230--truita-de-patates-sagardi":
    "/imported-dish-images/barcelona-truita-de-patates.png",
  "barcelona-spain--1231--bikini-cafe-zurich":
    "/imported-dish-images/barcelona-bikini.png",
  "san-francisco-united-states--533--sourdough-bread-boudin-bakery":
    "/imported-dish-images/san-francisco-sourdough-boudin-bakery.png",
  "san-francisco-united-states--534--mission-burrito-la-taqueria":
    "/imported-dish-images/san-francisco-mission-burrito-la-taqueria.png",
  "san-francisco-united-states--535--cioppino-sotto-mare":
    "/imported-dish-images/san-francisco-cioppino-sotto-mare.png",
  "san-francisco-united-states--536--dim-sum-good-mong-kok-bakery":
    "/imported-dish-images/san-francisco-dim-sum-good-mong-kok.png",
  "san-francisco-united-states--537--garlic-noodles-thanh-long":
    "/imported-dish-images/san-francisco-garlic-noodles-thanh-long.png",
  "san-francisco-united-states--538--dungeness-crab-swan-oyster-depot":
    "/imported-dish-images/san-francisco-dungeness-crab-swan-oyster-depot.png",
  "san-francisco-united-states--539--ramen-marufuku-ramen":
    "/imported-dish-images/san-francisco-ramen-marufuku.png",
  "san-francisco-united-states--540--burger-house-of-prime-rib":
    "/imported-dish-images/san-francisco-burger-house-of-prime-rib.png",
  "san-francisco-united-states--541--pizza-tony-pizza-napoletana":
    "/imported-dish-images/san-francisco-pizza-tony-pizza-napoletana.png",
  "san-francisco-united-states--542--tasting-menu-quince":
    "/imported-dish-images/san-francisco-tasting-menu-quince.png",
};

function toSlug(value: string): string {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[''ʼ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** City segment in canonical dish ids (e.g. `barcelona-spain`); not always `kebab(city)`. */
function citySlugPrefixFromDishId(dish: CsvDish): string {
  const m = dish.id.match(/^(.+?)--\d+--/);
  return m?.[1] ? m[1] : toSlug(dish.city);
}

function filenameForDishIdWithFallback(dish: CsvDish): string | null {
  const direct = byId[dish.id];
  if (direct) return direct;

  // Some datasets may include country in city slug (e.g. bangkok-thailand--327--...).
  // Try matching by stable suffix (--numeric-id--dish-slug) and then city slug.
  const suffix = dish.id.match(/(--\d+--.+)$/)?.[1];
  if (!suffix) return null;

  const citySlug = citySlugPrefixFromDishId(dish);
  const cityScopedId = `${citySlug}${suffix}`;
  if (byId[cityScopedId]) return byId[cityScopedId];

  const candidates = bySuffix.get(suffix) ?? [];
  if (candidates.length === 1) return byId[candidates[0]] ?? null;

  const cityMatch = candidates.find((id) => id.startsWith(`${citySlug}--`));
  if (cityMatch) return byId[cityMatch] ?? null;

  return null;
}

/**
 * Public URL for a file in /public/Images (served as /Images/...).
 * Filename is stored as in the folder; we encode for special characters in URLs.
 */
export function publicImageUrlForFilename(filename: string): string {
  return `/Images/${encodeURIComponent(filename)}`;
}

/** Local image from the Images folder when index has a file for this dish id. */
export function getLocalDishImageUrl(dish: CsvDish): string | null {
  const fn = filenameForDishIdWithFallback(dish);
  if (!fn) return null;
  return publicImageUrlForFilename(fn);
}

/**
 * Prefer explicit /public/imported-dish-images overrides, then /public/Images (indexed),
 * then spreadsheet URL.
 */
export function resolveDishImageUrl(dish: CsvDish): string | null {
  return (
    IMPORTED_DISH_IMAGES_BY_ID[dish.id] ??
    getLocalDishImageUrl(dish) ??
    (dish.imageUrl?.trim() || null)
  );
}
