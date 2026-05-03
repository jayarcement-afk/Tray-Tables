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
  "denpasar-bali-indonesia--879--babi-guling-ibu-oka":
    "/imported-dish-images/denpasar-bali-indonesia-babi-guling-ibu-oka.png",
  "denpasar-bali-indonesia--880--nasi-campur-warung-wardani":
    "/imported-dish-images/denpasar-bali-indonesia-nasi-campur-warung-wardani.png",
  "denpasar-bali-indonesia--881--sate-lilit-warung-mak-beng":
    "/imported-dish-images/denpasar-bali-indonesia-sate-lilit-warung-mak-beng.png",
  "denpasar-bali-indonesia--882--fish-soup-warung-mak-beng":
    "/imported-dish-images/denpasar-bali-indonesia-fish-soup-warung-mak-beng.png",
  "denpasar-bali-indonesia--883--lawaar-warung-nasi-bali-men-weti":
    "/imported-dish-images/denpasar-bali-indonesia-lawaar-warung-nasi-bali-men-weti.png",
  "denpasar-bali-indonesia--884--fried-duck-bebek-bengil":
    "/imported-dish-images/denpasar-bali-indonesia-fried-duck-bebek-bengil.png",
  "denpasar-bali-indonesia--885--vegetable-curry-kafe":
    "/imported-dish-images/denpasar-bali-indonesia-vegetable-curry-kafe.png",
  "denpasar-bali-indonesia--886--noodles-yellow-flower-cafe":
    "/imported-dish-images/noodles-yellow-flower-cafe.png",
  "denpasar-bali-indonesia--887--dessert-pancake-ubud-dessert":
    "/imported-dish-images/denpasar-bali-indonesia-dessert-pancake-ubud-dessert.png",
  "denpasar-bali-indonesia--888--tasting-menu-locavore":
    "/imported-dish-images/tasting-menu-locavore.png",
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
  "dublin-ireland--649--irish-stew-the-brazen-head":
    "/imported-dish-images/dublin-ireland-irish-stew-the-brazen-head.png",
  "dublin-ireland--650--full-irish-breakfast-keogh-cafe":
    "/imported-dish-images/dublin-ireland-full-irish-breakfast-keogh-cafe.png",
  "dublin-ireland--651--fish-and-chips-leo-burdock":
    "/imported-dish-images/dublin-ireland-fish-and-chips-leo-burdock.png",
  "dublin-ireland--652--boxty-gallaghers-boxty-house":
    "/imported-dish-images/dublin-ireland-boxty-gallaghers-boxty-house.png",
  "dublin-ireland--653--oysters-moran-oyster-cottage":
    "/imported-dish-images/dublin-ireland-oysters-moran-oyster-cottage.png",
  "dublin-ireland--654--burger-bunsen":
    "/imported-dish-images/dublin-ireland-burger-bunsen.png",
  "dublin-ireland--655--seafood-chowder-the-winding-stair":
    "/imported-dish-images/dublin-ireland-seafood-chowder-the-winding-stair.png",
  "dublin-ireland--656--soda-bread-queen-of-tarts":
    "/imported-dish-images/dublin-ireland-soda-bread-queen-of-tarts.png",
  "dublin-ireland--657--pub-pie-the-pie-maker":
    "/imported-dish-images/dublin-ireland-pub-pie-the-pie-maker.png",
  "dublin-ireland--658--tasting-menu-chapter-one":
    "/imported-dish-images/dublin-ireland-tasting-menu-chapter-one.png",
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
  "hamburg-germany--612--fischbroetchen-bruecke-10":
    "/imported-dish-images/hamburg-germany-fischbroetchen-bruecke-10.png",
  "hamburg-germany--613--labskaus-old-commercial-room":
    "/imported-dish-images/hamburg-germany-labskaus-old-commercial-room.png",
  "hamburg-germany--614--franzbroetchen-cafe-luise":
    "/imported-dish-images/hamburg-germany-franzbroetchen-cafe-luise.png",
  "hamburg-germany--615--currywurst-curry-pirate":
    "/imported-dish-images/hamburg-germany-currywurst-curry-pirate.png",
  "hamburg-germany--616--seafood-platter-fischereihafen-restaurant":
    "/imported-dish-images/hamburg-germany-seafood-platter-fischereihafen-restaurant.png",
  "hamburg-germany--617--schnitzel-restaurant-parlament":
    "/imported-dish-images/hamburg-germany-schnitzel-restaurant-parlament.png",
  "hamburg-germany--618--craft-beer-altes-maedchen":
    "/imported-dish-images/hamburg-germany-craft-beer-altes-maedchen.png",
  "hangzhou-china--819--west-lake-fish-lou-wai-lou":
    "/imported-dish-images/hangzhou-china-west-lake-fish-lou-wai-lou.png",
  "hangzhou-china--820--longjing-shrimp-zhi-wei-guan":
    "/imported-dish-images/hangzhou-china-longjing-shrimp-zhi-wei-guan.png",
  "hangzhou-china--821--beggar-chicken-zhi-wei-guan":
    "/imported-dish-images/hangzhou-china-beggar-chicken-zhi-wei-guan.png",
  "hangzhou-china--822--dongpo-pork-lou-wai-lou":
    "/imported-dish-images/hangzhou-china-dongpo-pork-lou-wai-lou.png",
  "hangzhou-china--823--noodles-fang-chun-jian":
    "/imported-dish-images/hangzhou-china-noodles-fang-chun-jian.png",
  "hangzhou-china--824--dumplings-zhi-wei-guan":
    "/imported-dish-images/hangzhou-china-dumplings-zhi-wei-guan.png",
  "hangzhou-china--825--pancakes-street-vendor-hefang":
    "/imported-dish-images/hangzhou-china-pancakes-street-vendor-hefang.png",
  "hangzhou-china--826--sweet-lotus-root-lou-wai-lou":
    "/imported-dish-images/hangzhou-china-sweet-lotus-root-lou-wai-lou.png",
  "hangzhou-china--827--fish-soup-xin-bailu":
    "/imported-dish-images/hangzhou-china-fish-soup-xin-bailu.png",
  "hangzhou-china--828--tasting-menu-jin-sha":
    "/imported-dish-images/hangzhou-china-tasting-menu-jin-sha.png",
  "hanoi-vietnam--376--pho-bo-pho-gia-truyen-bat-dan":
    "/imported-dish-images/hanoi-vietnam-pho-bo-pho-gia-truyen-bat-dan.png",
  "hanoi-vietnam--377--bun-cha-bun-cha-huong-lien":
    "/imported-dish-images/hanoi-vietnam-bun-cha-bun-cha-huong-lien.png",
  "hanoi-vietnam--378--banh-cuon-banh-cuon-gia-truyen-thanh-van":
    "/imported-dish-images/hanoi-vietnam-banh-cuon-banh-cuon-gia-truyen-thanh-van.png",
  "hanoi-vietnam--379--cha-ca-cha-ca-la-vong":
    "/imported-dish-images/hanoi-vietnam-cha-ca-cha-ca-la-vong.png",
  "hanoi-vietnam--380--bun-thang-cafe-gia-truyen":
    "/imported-dish-images/hanoi-vietnam-bun-thang-cafe-gia-truyen.png",
  "hanoi-vietnam--381--xoi-sticky-rice-xoi-yen":
    "/imported-dish-images/hanoi-vietnam-xoi-sticky-rice-xoi-yen.png",
  "hanoi-vietnam--382--egg-coffee-cafe-giang":
    "/imported-dish-images/hanoi-vietnam-egg-coffee-cafe-giang.png",
  "hanoi-vietnam--383--bun-bo-nam-bo-bun-bo-nam-bo-ba-nam":
    "/imported-dish-images/hanoi-vietnam-bun-bo-nam-bo-bun-bo-nam-bo-ba-nam.png",
  "hanoi-vietnam--384--nem-ran-fried-rolls-quan-an-ngon":
    "/imported-dish-images/hanoi-vietnam-nem-ran-fried-rolls-quan-an-ngon.png",
  "hanoi-vietnam--385--che-sweet-soup-che-ba-thin":
    "/imported-dish-images/hanoi-vietnam-che-sweet-soup-che-ba-thin.png",
  "havana-cuba--543--ropa-vieja-la-guarida":
    "/imported-dish-images/havana-cuba-ropa-vieja-la-guarida.png",
  "havana-cuba--544--cuban-sandwich-el-floridita":
    "/imported-dish-images/havana-cuba-cuban-sandwich-el-floridita.png",
  "havana-cuba--545--moropo-pork-do-a-eutimia":
    "/imported-dish-images/havana-cuba-moropo-pork-do-a-eutimia.png",
  "havana-cuba--546--tostones-la-vitrola":
    "/imported-dish-images/havana-cuba-tostones-la-vitrola.png",
  "havana-cuba--547--seafood-paella-paladar-los-mercaderes":
    "/imported-dish-images/havana-cuba-seafood-paella-paladar-los-mercaderes.png",
  "havana-cuba--548--lobster-el-cocinero":
    "/imported-dish-images/havana-cuba-lobster-el-cocinero.png",
  "havana-cuba--549--black-beans-and-rice-n-a":
    "/imported-dish-images/havana-cuba-black-beans-and-rice-n-a.png",
  "havana-cuba--550--flan-la-fontana":
    "/imported-dish-images/havana-cuba-flan-la-fontana.png",
  "havana-cuba--551--fried-plantains-n-a":
    "/imported-dish-images/havana-cuba-fried-plantains-n-a.png",
  "helsinki-finland--266--salmon-soup-lohikeitto-ravintola-savotta":
    "/imported-dish-images/helsinki-finland-salmon-soup-lohikeitto-ravintola-savotta.png",
  "helsinki-finland--267--fried-baltic-herring-sea-horse":
    "/imported-dish-images/helsinki-finland-fried-baltic-herring-sea-horse.png",
  "helsinki-finland--268--vorschmack-savoy":
    "/imported-dish-images/helsinki-finland-vorschmack-savoy.png",
  "helsinki-finland--269--reindeer-fillet-kappeli":
    "/imported-dish-images/helsinki-finland-reindeer-fillet-kappeli.png",
  "helsinki-finland--270--meatballs-kosmos":
    "/imported-dish-images/helsinki-finland-meatballs-kosmos.png",
  "helsinki-finland--271--pea-soup-and-pancakes-ravintola-zetor":
    "/imported-dish-images/helsinki-finland-pea-soup-and-pancakes-ravintola-zetor.png",
  "helsinki-finland--272--pyttipannu-hash-house-savotta":
    "/imported-dish-images/helsinki-finland-pyttipannu-hash-house-savotta.png",
  "helsinki-finland--273--karelian-pie-caf-fazer":
    "/imported-dish-images/helsinki-finland-karelian-pie-caf-fazer.png",
  "helsinki-finland--274--squeaky-cheese-w-cloudberries-local-traditional-restaurants":
    "/imported-dish-images/helsinki-finland-squeaky-cheese-w-cloudberries-local-traditional-restaurants.png",
  "helsinki-finland--275--cinnamon-bun-ekberg-1852":
    "/imported-dish-images/helsinki-finland-cinnamon-bun-ekberg-1852.png",
  "hiroshima-japan--789--hiroshima-okonomiyaki-okonomimura":
    "/imported-dish-images/hiroshima-japan-hiroshima-okonomiyaki-okonomimura.png",
  "hiroshima-japan--790--oysters-kakiya":
    "/imported-dish-images/hiroshima-japan-oysters-kakiya.png",
  "hiroshima-japan--791--eel-rice-ueno":
    "/imported-dish-images/hiroshima-japan-eel-rice-ueno.png",
  "hiroshima-japan--792--ramen-ramen-yutaka":
    "/imported-dish-images/hiroshima-japan-ramen-ramen-yutaka.png",
  "hiroshima-japan--793--tempura-tenmatsu":
    "/imported-dish-images/hiroshima-japan-tempura-tenmatsu.png",
  "hiroshima-japan--794--soba-mitchan-sohonten":
    "/imported-dish-images/hiroshima-japan-soba-mitchan-sohonten.png",
  "hiroshima-japan--795--tonkatsu-nagataya":
    "/imported-dish-images/hiroshima-japan-tonkatsu-nagataya.png",
  "hiroshima-japan--796--fried-oysters-kaki-fukumaru":
    "/imported-dish-images/hiroshima-japan-fried-oysters-kaki-fukumaru.png",
  "hiroshima-japan--797--sweets-momiji-manju-fujiiya":
    "/imported-dish-images/hiroshima-japan-sweets-momiji-manju-fujiiya.png",
  "hiroshima-japan--798--tasting-menu-ryokan-iwaso":
    "/imported-dish-images/hiroshima-japan-tasting-menu-ryokan-iwaso.png",
  "ho-chi-minh-city-vietnam--366--pho-hoa-pasteur":
    "/imported-dish-images/ho-chi-minh-city-vietnam-pho-hoa-pasteur.png",
  "ho-chi-minh-city-vietnam--367--banh-mi-banh-mi-huynh-hoa":
    "/imported-dish-images/ho-chi-minh-city-vietnam-banh-mi-banh-mi-huynh-hoa.png",
  "ho-chi-minh-city-vietnam--368--com-tam-broken-rice-com-tam-ba-ghien":
    "/imported-dish-images/ho-chi-minh-city-vietnam-com-tam-broken-rice-com-tam-ba-ghien.png",
  "ho-chi-minh-city-vietnam--369--hu-tieu-hu-tieu-thanh-xuan":
    "/imported-dish-images/ho-chi-minh-city-vietnam-hu-tieu-hu-tieu-thanh-xuan.png",
  "ho-chi-minh-city-vietnam--370--banh-xeo-banh-xeo-46a":
    "/imported-dish-images/ho-chi-minh-city-vietnam-banh-xeo-banh-xeo-46a.png",
  "ho-chi-minh-city-vietnam--371--bo-kho-bun-bo-kho-ba-hai":
    "/imported-dish-images/ho-chi-minh-city-vietnam-bo-kho-bun-bo-kho-ba-hai.png",
  "ho-chi-minh-city-vietnam--372--oc-snails-and-shellfish-oc-dao":
    "/imported-dish-images/ho-chi-minh-city-vietnam-oc-snails-and-shellfish-oc-dao.png",
  "ho-chi-minh-city-vietnam--373--ca-kho-to-nha-hang-ngon":
    "/imported-dish-images/ho-chi-minh-city-vietnam-ca-kho-to-nha-hang-ngon.png",
  "ho-chi-minh-city-vietnam--374--goi-cuon-fresh-rolls-quan-an-ngon":
    "/imported-dish-images/ho-chi-minh-city-vietnam-goi-cuon-fresh-rolls-quan-an-ngon.png",
  "ho-chi-minh-city-vietnam--375--vietnamese-iced-coffee-cheese-coffee":
    "/imported-dish-images/ho-chi-minh-city-vietnam-vietnamese-iced-coffee-cheese-coffee.png",
  "lisbon-portugal--138--grilled-prawns-cervejaria-ramiro":
    "/imported-dish-images/lisbon-grilled-prawns-cervejaria-ramiro.png",
  "los-angeles-united-states--12--tacos-al-pastor-leo-s-taco-truck":
    "/imported-dish-images/los-angeles-tacos-al-pastor-leos-taco-truck.png",
  "new-orleans-united-states--475--beignets-cafe-beignet":
    "/imported-dish-images/new-orleans-united-states-beignets-cafe-beignet.png",
  "new-orleans-united-states--476--gumbo-gumbo-shop":
    "/imported-dish-images/new-orleans-united-states-gumbo-gumbo-shop.png",
  "new-orleans-united-states--477--jambalaya-mothers":
    "/imported-dish-images/new-orleans-united-states-jambalaya-mothers.png",
  "new-orleans-united-states--478--fried-chicken-willie-maes-scotch-house":
    "/imported-dish-images/new-orleans-united-states-fried-chicken-willie-maes-scotch-house.png",
  "new-orleans-united-states--479--muffuletta-central-grocery":
    "/imported-dish-images/new-orleans-united-states-muffuletta-central-grocery.png",
  "new-orleans-united-states--480--oysters-rockefeller-antoines":
    "/imported-dish-images/new-orleans-united-states-oysters-rockefeller-antoines.png",
  "new-orleans-united-states--481--red-beans-and-rice-lil-dizzys":
    "/imported-dish-images/new-orleans-united-states-red-beans-and-rice-lil-dizzys.png",
  "new-orleans-united-states--482--etouffee-mandinas":
    "/imported-dish-images/new-orleans-united-states-etouffee-mandinas.png",
  "new-orleans-united-states--483--po-boy-parkway-bakery":
    "/imported-dish-images/new-orleans-united-states-po-boy-parkway-bakery.png",
  "new-orleans-united-states--484--bananas-foster-brennans":
    "/imported-dish-images/new-orleans-united-states-bananas-foster-brennans.png",
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
  "ubud-indonesia--893--noodles-yellow-flower-cafe":
    "/imported-dish-images/noodles-yellow-flower-cafe.png",
  "ubud-indonesia--898--tasting-menu-locavore":
    "/imported-dish-images/tasting-menu-locavore.png",
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
