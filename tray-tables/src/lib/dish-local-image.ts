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
  "buenos-aires-argentina--1037--asado-don-julio":
    "/imported-dish-images/buenos-aires-asado-don-julio.png",
  "buenos-aires-argentina--1038--empanadas-el-sanjuanino":
    "/imported-dish-images/buenos-aires-empanadas-el-sanjuanino.png",
  "buenos-aires-argentina--1039--milanesa-cafe-san-juan":
    "/imported-dish-images/buenos-aires-milanesa-cafe-san-juan.png",
  "buenos-aires-argentina--1040--choripan-la-cabrera-grill":
    "/imported-dish-images/buenos-aires-choripan-la-cabrera-grill.png",
  "buenos-aires-argentina--1041--pizza-guerin":
    "/imported-dish-images/buenos-aires-pizza-guerin.png",
  "buenos-aires-argentina--1042--provoleta-don-julio":
    "/imported-dish-images/buenos-aires-provoleta-don-julio.png",
  "buenos-aires-argentina--1043--pasta-sarkis":
    "/imported-dish-images/buenos-aires-pasta-sarkis.png",
  "buenos-aires-argentina--1044--ice-cream-cadore":
    "/imported-dish-images/buenos-aires-ice-cream-cadore.png",
  "buenos-aires-argentina--1045--seafood-rodrigo-restaurante":
    "/imported-dish-images/buenos-aires-seafood-rodrigo-restaurante.png",
  "buenos-aires-argentina--1046--tasting-menu-aramburu":
    "/imported-dish-images/buenos-aires-tasting-menu-aramburu.png",
  "cartagena-colombia--592--arepas-de-huevo-arepas-pues":
    "/imported-dish-images/cartagena-arepas-de-huevo-arepas-pues.png",
  "cartagena-colombia--593--ceviche-la-cevicheria":
    "/imported-dish-images/cartagena-ceviche-la-cevicheria.png",
  "cartagena-colombia--594--coconut-rice-la-cocina-de-pepina":
    "/imported-dish-images/cartagena-coconut-rice-la-cocina-de-pepina.png",
  "cartagena-colombia--595--fried-fish-pesca-del-dia":
    "/imported-dish-images/cartagena-fried-fish-pesca-del-dia.png",
  "cartagena-colombia--596--empanadas-la-cocina-de-pepina":
    "/imported-dish-images/cartagena-empanadas-la-cocina-de-pepina.png",
  "cartagena-colombia--597--patacones-la-mulata":
    "/imported-dish-images/cartagena-patacones-la-mulata.png",
  "cartagena-colombia--598--sancocho-cand":
    "/imported-dish-images/cartagena-sancocho-cande.png",
  "cartagena-colombia--599--craft-cocktails-alquimico":
    "/imported-dish-images/cartagena-craft-cocktails-alquimico.png",
  "cartagena-colombia--600--ice-cream-el-gelato-de-panna":
    "/imported-dish-images/cartagena-ice-cream-el-gelato-de-panna.png",
  "cartagena-colombia--601--tasting-menu-carmen":
    "/imported-dish-images/cartagena-tasting-menu-carmen.png",
  "cebu-city-philippines--919--lechon-cebu-original-lechon-belly":
    "/imported-dish-images/cebu-city-lechon-cebu-original-lechon-belly.png",
  "cebu-city-philippines--920--sinigang-house-of-lechon":
    "/imported-dish-images/cebu-city-sinigang-house-of-lechon.png",
  "cebu-city-philippines--921--puso-rice-aa-bbq":
    "/imported-dish-images/cebu-city-puso-rice-aa-bbq.png",
  "cebu-city-philippines--922--bbq-skewers-larsian-bbq":
    "/imported-dish-images/cebu-city-bbq-skewers-larsian-bbq.png",
  "cebu-city-philippines--923--seafood-sutukil":
    "/imported-dish-images/cebu-city-seafood-sutukil.png",
  "cebu-city-philippines--924--noodles-bam-i":
    "/imported-dish-images/cebu-city-noodles-bam-i.png",
  "cebu-city-philippines--925--chicken-inasal-jollibee":
    "/imported-dish-images/cebu-city-chicken-inasal-jollibee.png",
  "cebu-city-philippines--926--dessert-halo-halo-ding-qua-qua":
    "/imported-dish-images/cebu-city-dessert-halo-halo-ding-qua-qua.png",
  "cebu-city-philippines--927--breakfast-plates-abaca-baking-company":
    "/imported-dish-images/cebu-city-breakfast-plates-abaca-baking-company.png",
  "chiang-mai-thailand--336--khao-soi-khao-soi-khun-yai":
    "/imported-dish-images/chiang-mai-khao-soi-khun-yai.png",
  "chiang-mai-thailand--339--khao-krapao-ginger-farm-kitchen":
    "/imported-dish-images/chiang-mai-khao-krapao-ginger-farm-kitchen.png",
  "chiang-mai-thailand--340--larb-larb-bunker":
    "/imported-dish-images/chiang-mai-larb-larb-bunker.png",
  "chiang-mai-thailand--341--khanom-jeen-northern-curry-shops":
    "/imported-dish-images/chiang-mai-khanom-jeen-northern-curry-shops.png",
  "chiang-mai-thailand--342--moo-ping-city-markets":
    "/imported-dish-images/chiang-mai-moo-ping-city-markets.png",
  "chiang-mai-thailand--343--khao-niew-sticky-rice-local-markets":
    "/imported-dish-images/chiang-mai-khao-niew-sticky-rice-local-markets.png",
  "chiang-mai-thailand--344--fried-banana-rotee-and-snack-carts":
    "/imported-dish-images/chiang-mai-fried-banana-rotee-and-snack-carts.png",
  "chiang-mai-thailand--345--coconut-ice-cream-kad-luang-market":
    "/imported-dish-images/chiang-mai-coconut-ice-cream-kad-luang-market.png",
  "copenhagen-denmark--246--sm-rrebr-d-restaurant-sch-nnemann":
    "/imported-dish-images/copenhagen-smorrebrod-restaurant-schonnemann.png",
  "copenhagen-denmark--247--fl-skesteg-det-lille-apotek":
    "/imported-dish-images/copenhagen-flaeskesteg-det-lille-apotek.png",
  "copenhagen-denmark--248--wienerbr-d-danish-pastry-andersen-bakery":
    "/imported-dish-images/copenhagen-wienerbrod-danish-pastry-andersen-bakery.png",
  "copenhagen-denmark--249--tarteletter-restaurant-puk":
    "/imported-dish-images/copenhagen-tarteletter-restaurant-puk.png",
  "copenhagen-denmark--250--stegt-fl-sk-med-persillesovs-caf-sorgenfri":
    "/imported-dish-images/copenhagen-stegt-flaesk-med-persillesovs-cafe-sorgenfri.png",
  "copenhagen-denmark--251--fish-cakes-fiskefrikadeller-aamanns-deli":
    "/imported-dish-images/copenhagen-fish-cakes-fiskefrikadeller-aamanns-deli.png",
  "copenhagen-denmark--252--gr-d-porridge-gr-d":
    "/imported-dish-images/copenhagen-grod-porridge-grod.png",
  "copenhagen-denmark--253--herring-platter-pal-gade":
    "/imported-dish-images/copenhagen-herring-platter-palaegade.png",
  "copenhagen-denmark--254--rye-bread-sandwich-torvehallerne-stalls":
    "/imported-dish-images/copenhagen-rye-bread-sandwich-torvehallerne-stalls.png",
  "copenhagen-denmark--255--bleskiver-christmas-markets-caf-s":
    "/imported-dish-images/copenhagen-aebleskiver-christmas-markets-cafes.png",
  "da-nang-vietnam--859--mi-quang-mi-quang-ba-mua":
    "/imported-dish-images/da-nang-mi-quang-mi-quang-ba-mua.png",
  "da-nang-vietnam--860--banh-xeo-banh-xeo-ba-duong":
    "/imported-dish-images/da-nang-banh-xeo-banh-xeo-ba-duong.png",
  "da-nang-vietnam--861--seafood-hotpot-be-man-restaurant":
    "/imported-dish-images/da-nang-seafood-hotpot-be-man-restaurant.png",
  "da-nang-vietnam--862--bun-cha-ca-bun-cha-ca-han":
    "/imported-dish-images/da-nang-bun-cha-ca-bun-cha-ca-han.png",
  "da-nang-vietnam--863--fried-fish-nam-danh-seafood":
    "/imported-dish-images/da-nang-fried-fish-nam-danh-seafood.png",
  "da-nang-vietnam--864--spring-rolls-bep-cuon-da-nang":
    "/imported-dish-images/da-nang-spring-rolls-bep-cuon-da-nang.png",
  "da-nang-vietnam--865--banh-mi-banh-mi-ba-lan":
    "/imported-dish-images/da-nang-banh-mi-banh-mi-ba-lan.png",
  "da-nang-vietnam--866--rice-plates-quan-com-hue-ngon":
    "/imported-dish-images/da-nang-rice-plates-quan-com-hue-ngon.png",
  "da-nang-vietnam--867--dessert-sweet-soup-che-xoa-xoa-hat-luu":
    "/imported-dish-images/da-nang-dessert-sweet-soup-che-xoa-xoa-hat-luu.png",
  "delhi-india--929--butter-chicken-moti-mahal":
    "/imported-dish-images/delhi-butter-chicken-moti-mahal.png",
  "delhi-india--930--chole-bhature-sita-ram-diwan-chand":
    "/imported-dish-images/delhi-chole-bhature-sita-ram-diwan-chand.png",
  "delhi-india--931--paratha-moolchand-paratha":
    "/imported-dish-images/delhi-paratha-moolchand-paratha.png",
  "delhi-india--932--dal-makhani-bukhara":
    "/imported-dish-images/delhi-dal-makhani-bukhara.png",
  "delhi-india--933--kebabs-karims":
    "/imported-dish-images/delhi-kebabs-karims.png",
  "delhi-india--934--biryani-al-jawahar":
    "/imported-dish-images/delhi-biryani-al-jawahar.png",
  "delhi-india--935--street-chaat-chaat-corner":
    "/imported-dish-images/delhi-street-chaat-chaat-corner.png",
  "delhi-india--936--rajma-chawal-sagar-ratna":
    "/imported-dish-images/delhi-rajma-chawal-sagar-ratna.png",
  "delhi-india--937--dessert-jalebi-old-famous-jalebi":
    "/imported-dish-images/delhi-dessert-jalebi-old-famous-jalebi.png",
  "delhi-india--938--tasting-menu-indian-accent":
    "/imported-dish-images/delhi-tasting-menu-indian-accent.png",
  "florence-italy--66--bistecca-alla-fiorentina-trattoria-cammillo":
    "/imported-dish-images/florence-bistecca-alla-fiorentina-trattoria-cammillo.png",
  "florence-italy--67--penne-al-vodka-alla-vecchia-bettola":
    "/imported-dish-images/florence-penne-al-vodka-alla-vecchia-bettola.png",
  "florence-italy--68--ribollita-trattoria-da-burde":
    "/imported-dish-images/florence-ribollita-trattoria-da-burde.png",
  "florence-italy--69--lampredotto-sandwich-trippaio-del-porcellino":
    "/imported-dish-images/florence-lampredotto-sandwich-trippaio-del-porcellino.png",
  "florence-italy--70--pappa-al-pomodoro-vini-e-vecchi-sapori":
    "/imported-dish-images/florence-pappa-al-pomodoro-vini-e-vecchi-sapori.png",
  "florence-italy--71--crostini-neri-trattoria-sabatino":
    "/imported-dish-images/florence-crostini-neri-trattoria-sabatino.png",
  "florence-italy--72--panino-toscano-retrobottega":
    "/imported-dish-images/florence-panino-toscano-retrobottega.png",
  "florence-italy--73--tortelli-mugellani-ristorante-nugolo":
    "/imported-dish-images/florence-tortelli-mugellani-ristorante-nugolo.png",
  "florence-italy--74--gelato-hazelnut-la-carraia":
    "/imported-dish-images/florence-gelato-hazelnut-la-carraia.png",
  "florence-italy--75--cantucci-e-vin-santo-enoteca-spontanea":
    "/imported-dish-images/florence-cantucci-e-vin-santo-enoteca-spontanea.png",
  "florence-italy--1217--pappardelle-al-cinghiale-osteria-del-cinghiale-bianco":
    "/imported-dish-images/florence-pappardelle-al-cinghiale-osteria-del-cinghiale-bianco.png",
  "florence-italy--1218--crostini-di-fegato-buca-mario":
    "/imported-dish-images/florence-crostini-di-fegato-buca-mario.png",
  "gold-coast-australia--1167--meat-pie-yatala-pies":
    "/imported-dish-images/gold-coast-meat-pie-yatala-pies.jpg",
  "gold-coast-australia--1168--fish-and-chips-peters-fish-market":
    "/imported-dish-images/gold-coast-fish-and-chips-peters-fish-market.jpg",
  "gold-coast-australia--1169--bug-roll-rick-shores":
    "/imported-dish-images/gold-coast-bug-roll-rick-shores.jpg",
  "gold-coast-australia--1170--acai-bowl-cardamom-pod":
    "/imported-dish-images/gold-coast-acai-bowl-cardamom-pod.jpg",
  "gold-coast-australia--1171--steak-hurricane-grill":
    "/imported-dish-images/gold-coast-steak-hurricane-grill.jpg",
  "gold-coast-australia--1172--prawn-pasta-little-truffle":
    "/imported-dish-images/gold-coast-prawn-pasta-little-truffle.jpg",
  "gold-coast-australia--1173--burger-easy-street-diner":
    "/imported-dish-images/gold-coast-burger-easy-street-diner.jpg",
  "gold-coast-australia--1174--gelato-messina-broadbeach":
    "/imported-dish-images/gold-coast-gelato-messina-broadbeach.jpg",
  "gold-coast-australia--1175--calamari-glenelg-public-house":
    "/imported-dish-images/gold-coast-calamari-glenelg-public-house.jpg",
  "gold-coast-australia--1176--poke-bowl-blendlove":
    "/imported-dish-images/gold-coast-poke-bowl-blendlove.jpg",
  "lisbon-portugal--138--grilled-prawns-cervejaria-ramiro":
    "/imported-dish-images/lisbon-grilled-prawns-cervejaria-ramiro.png",
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
  "tokyo--1278--toro-sushi-tsukiji-fish-market":
    "/imported-dish-images/tokyo-toro-sushi-tsukiji-fish-market.png",
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
  const direct = dish.imageUrl?.trim() ?? "";
  if (direct.startsWith("data:image/")) return direct;
  return (
    IMPORTED_DISH_IMAGES_BY_ID[dish.id] ??
    getLocalDishImageUrl(dish) ??
    (direct || null)
  );
}
