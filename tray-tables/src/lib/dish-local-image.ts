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
  "beijing-china--809--peking-duck-quanjude":
    "/imported-dish-images/beijing-peking-duck-quanjude.png",
  "beijing-china--810--peking-duck-da-dong":
    "/imported-dish-images/beijing-peking-duck-da-dong.png",
  "beijing-china--811--jianbing-jianbing-guozi-stand":
    "/imported-dish-images/beijing-jianbing-guozi-stand.png",
  "beijing-china--812--zhajiangmian-haiwanju":
    "/imported-dish-images/beijing-zhajiangmian-haiwanju.png",
  "beijing-china--813--mongolian-hot-pot-dong-lai-shun":
    "/imported-dish-images/beijing-mongolian-hot-pot-dong-lai-shun.png",
  "beijing-china--814--lamb-skewers-da-shi-kebab":
    "/imported-dish-images/beijing-lamb-skewers-da-shi-kebab.png",
  "beijing-china--815--stuffed-pancake-baoyuan-dumpling":
    "/imported-dish-images/beijing-stuffed-pancake-baoyuan-dumpling.png",
  "beijing-china--816--fried-liver-yaoji-chaogan":
    "/imported-dish-images/beijing-fried-liver-yaoji-chaogan.png",
  "beijing-china--817--dumplings-xiao-guan":
    "/imported-dish-images/beijing-dumplings-xiao-guan.png",
  "beijing-china--818--tasting-menu-trb-hutong":
    "/imported-dish-images/beijing-tasting-menu-trb-hutong.png",
  "berlin-germany--166--currywurst-konnopke-s-imbiss":
    "/imported-dish-images/berlin-currywurst-konnopke.png",
  "berlin-germany--167--d-ner-kebab-mustafa-s-gem-se-kebap":
    "/imported-dish-images/berlin-doner-mustafa-gemuse-kebap.png",
  "berlin-germany--168--eisbein-pork-knuckle-max-und-moritz":
    "/imported-dish-images/berlin-eisbein-max-und-moritz.png",
  "berlin-germany--169--k-nigsberger-klopse-lutter-and-wegner":
    "/imported-dish-images/berlin-koenigsberger-klopse-lutter-wegner.png",
  "berlin-germany--170--schnitzel-jolesch":
    "/imported-dish-images/berlin-schnitzel-jolesch.png",
  "berlin-germany--171--berliner-pfannkuchen-caf-kranzler":
    "/imported-dish-images/berlin-berliner-pfannkuchen-cafe-kranzler.png",
  "berlin-germany--172--k-sesp-tzle-suppenk-che":
    "/imported-dish-images/berlin-kaesepatzle-suppenkuche.png",
  "berlin-germany--173--gulasch-solar-sky-bar":
    "/imported-dish-images/berlin-gulasch-solar-sky-bar.png",
  "berlin-germany--174--roast-duck-grill-royal":
    "/imported-dish-images/berlin-roast-duck-grill-royal.png",
  "berlin-germany--175--pretzel-b-ckerei-siebert":
    "/imported-dish-images/berlin-pretzel-baeckerei-siebert.png",
  "berlin-germany--1237--ketwurst-konnopkes-imbiss":
    "/imported-dish-images/berlin-ketwurst-konnopkes-imbiss.png",
  "berlin-germany--1238--bouletten-gaststatte-w-prassnik":
    "/imported-dish-images/berlin-bouletten-gaststatte-w-prassnik.png",
  "berlin-germany--1239--hackepeter-zur-letzten-instanz":
    "/imported-dish-images/berlin-hackepeter-zur-letzten-instanz.png",
  "berlin-germany--1240--tote-oma-max-und-moritz":
    "/imported-dish-images/berlin-tote-oma-max-und-moritz.png",
  "berlin-germany--1242--maultaschen-schwabylon":
    "/imported-dish-images/berlin-maultaschen-schwabylon.png",
  "berlin-germany--1243--kartoffelpuffer-volkskammer":
    "/imported-dish-images/berlin-kartoffelpuffer-volkskammer.png",
  "los-angeles-united-states--12--tacos-al-pastor-leo-s-taco-truck":
    "/imported-dish-images/los-angeles-tacos-al-pastor-leos-taco-truck.png",
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
