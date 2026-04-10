#!/usr/bin/env python3
"""One-off: expand short_history, set regional_connection to null. Regenerate seed.sql values."""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "supabase" / "seed.sql"

# Key: "city_slug|dish name" — paragraph: arrival in region + development in city/area.
HIST: dict[str, str] = {}

def add(city: str, name: str, text: str) -> None:
    HIST[f"{city}|{name}"] = text.replace("'", "''")


# --- Tokyo ---
add("tokyo", "Yakitori", "Skewered chicken took shape in Japan as postwar yatai and small grills fed workers near stations. In Tokyo the format became an izakaya default—salt or tare, parted cuts, and charcoal smoke. Shops clustered around rail hubs and nightlife districts, turning yakitori into the city after-hours language. Today Tokyo still sets the template many izakaya abroad imitate.")
add("tokyo", "Shoyu ramen", "Chinese-style noodle soup met Japanese tastes in the early 20th century and diverged into regional styles. Tokyo shoyu ramen favors a clearer, soy-seasoned broth with curly noodles and restrained toppings. Salaryman neighborhoods and ramen rows in Ikebukuro and elsewhere pushed competition on broth clarity and chashu craft. The capital became a global export hub for that particular bowl.")
add("tokyo", "Tsukemen", "Thick broths and dipping noodles spread as cooks chased richer flavor without soggy noodles. Tokyo shops popularized tsukemen as a Showa-era answer to long queues and heavy soup. East-side ramen battlegrounds still iterate on fish-pork blends and noodle chew. The dish remains identified with capital-level experimentation more than with a single rural hometown.")
add("tokyo", "Tonkatsu", "Breaded cutlets arrived through yōshoku restaurants adapting European frying to Japanese pantries. Tokyo department-store restaurants and old chains normalized tonkatsu sets with shredded cabbage and miso soup. The city framed the dish as everyday comfort rather than special-occasion Western food. Tonkatsu counters remain a benchmark stop for visitors mapping Japanese-style western cuisine.")
add("tokyo", "Tempura teishoku", "Edo-period frying began as fast street food; later Ginza-era shops elevated tempura into coursed meals. Tokyo chefs refined oil temperature, batter rhythm, and seasonal seafood for counter seating. Teishoku sets made high-end tempura a lunch and gift-trip ritual. The capital still hosts some of the country most famous tempura counters.")
add("tokyo", "Gyudon", "Simmered beef on rice spread as affordable protein after beef entered the mainstream diet. National chains headquartered in the capital turned gyudon into a commuter default around major stations. Late-night bowls became part of Tokyo rhythm for shift workers and students. The format is now synonymous with fast, filling Kanto counter service.")
add("tokyo", "Unagi kabayaki", "Grilled eel with sweet tare has old river-town roots; Edo developed a strong unagi restaurant culture. Tokyo unagi-ya emphasize knife work, charcoal, and lacquer-box presentation over rice. Summer “doyo no ushi no hi” marketing still spikes city demand. Specialist shops anchor neighborhood maps across the wards.")
add("tokyo", "Tamagoyaki", "Layered omelet crossed from home cooking into sushi bars as a benchmark of knife and grill control. Tokyo sushi culture treated tamago as a finishing measure of a chef skill. Depachika and markets sell the same slices tourists recognize from omakase counters. The dish signals Edomae discipline as much as breakfast fuel.")
add("tokyo", "Monjayaki", "Kanto working-class cooks stretched flour-batter snacks into a communal griddle dish related to okonomiyaki. Tsukishima street became the spiritual home where cabbage-heavy monja is part theater. Postwar scarcity probably spurred the runnier style. Visitors still treat the neighborhood as the place to try it in Tokyo.")

# --- Paris ---
add("paris", "Steak frites", "Brasserie culture fused French meat cookery with fried potatoes as an affordable plate for urban workers. Paris made steak-frites the weeknight standard you can find in every arrondissement. Cuts and sauces vary, but the pairing stayed a bistro export worldwide. The city still argues over frites crunch and au poivre balance.")
add("paris", "Croque-monsieur", "Café counters needed a hot, quick lunch as Paris office life grew in the early 20th century. The ham-cheese sandwich with optional béchamel became the default; the egg-topped madame variant followed. Boulevard cafés still serve it with a small salad as a textbook Paris lunch. Tourists and locals alike treat it as edible shorthand for café life.")
add("paris", "French onion soup", "Onion soup fortified Les Halles laborers before the market moved; gratinéed bowls turned into bistro comfort. Paris kitchens popularized the cheese lid and beef broth depth tourists expect today. Late-night service kept it on brasserie menus after shifts ended. It is now a global symbol of Paris even when the best bowls are debated block by block.")
add("paris", "Coq au vin", "Braised chicken in wine is an old provincial pattern; Burgundy claims part of the lineage. Paris restaurants adopted it as a Sunday bistro dish that could showcase wine and butcher quality. The capital presentation—mushrooms, pearl onions, lardons—became the template travelers know. It remains a bridge between regional terroir and city dining rooms.")
add("paris", "Steak tartare", "Raw chopped beef with capers and egg yolk spread as a bistro test of trust in the butcher. Paris made tartare a benchmark of French beef culture and natural-wine bar menus. Frites on the side nod to brasserie habit. It is less about terroir than about urban confidence in cold-chain quality.")
add("paris", "Escargots de Bourgogne", "Snails in parsley-garlic butter were a Burgundian pattern that brasseries turned into a Paris starter ritual. Escargots became a rite-of-passage dish for visitors learning French table cues. Paris service still emphasizes hot plates, bubbling butter, and bread for sopping. The dish signals classic brasserie more than a single neighborhood.")
add("paris", "Crêpes & galettes", "Breton migration brought buckwheat galettes and wheat crêpes to Montparnasse and beyond. Paris crêperies multiplied as affordable evening meals for students and workers. Sweet and savory counters remain a budget-friendly night out. The city is now one of the easiest places to taste Brittany without leaving Île-de-France.")
add("paris", "Duck confit", "Slow-cooked salt-cured duck is a southwest technique that Paris kitchens refined for bistro plates. Confit traveled along trade routes into city freezers and reheating lines. Paris menus often pair it with lentils or potatoes in the Sarladais style. It represents how regional preservation met metropolitan service.")
add("paris", "Jambon-beurre", "Industrial Paris needed a fast lunch that bakeries could assemble at scale. Thin ham, butter, and baguette became the sandwich default long before trendy fillings. Every serious boulangerie still sells it as a benchmark of bread and ham quality. It is the quiet icon of Paris working lunch.")

# --- Mexico City ---
add("mexico-city", "Tacos al pastor", "Lebanese immigrants brought vertical spit roasting; Mexico adapted it to marinated pork, pineapple, and chile. Mexico City taquerías turned al pastor into the capital late-night identity. Colonias stack competing spits blocks apart. The format is now the city signature taco style worldwide.")
add("mexico-city", "Carnitas tacos", "Michoacán-style slow pork traveled with migrants and wholesale meat markets. CDMX tortillerías and Sunday cooks scaled carnitas for family meals and taquerías. Crisped edges and salsa variety became capital habits. The dish bridges regional technique with metro-scale supply.")
add("mexico-city", "Pozole", "Hominy stew tied to celebration and region; it consolidated as a national party food across Mexico. Mexico City canteens and home kitchens serve red, green, and white versions with lavish garnish. Weekend pozole remains a comfort marker after busy weeks. Independence and family gatherings still call for a pot on the stove.")
add("mexico-city", "Chiles en nogada", "Puebla created the walnut-sauced stuffed poblano tied to independence symbolism. Mexico City tables embraced it for September patriotism and fine-dining menus. Flag colors on the plate reinforced national narrative. Seasonal pomegranate availability still shapes when restaurants push it hardest.")
add("mexico-city", "Quesadillas de huitlacoche", "Corn smut was an Aztec ingredient that survived in central Mexican cooking. Capital markets and weekend cooks fold huitlacoche into quesadillas for earthy, smoky depth. CDMX is a major stage for mercado-style fillings beyond cheese alone. The dish ties urban eaters to pre-Hispanic flavor.")
add("mexico-city", "Tamales", "Steamed masa in husks predates colonization; breakfast street culture amplified tamales in the capital. Vendors with giant ollas became a morning soundtrack across neighborhoods. Fillings range from mole to sweet, reflecting migration into the metro. Tamales remain an affordable, portable taste of home regions.")
add("mexico-city", "Elote", "Grilled corn with mayo, cheese, and chile spread through street fairs and plazas. Mexico City carts made elote and esquites ubiquitous around metro exits and parks. Lime and chile heat balance sweetness for walking snacks. It is street food grammar for CDMX everyday life.")
add("mexico-city", "Mole poblano", "Complex mole from convent kitchens became a feast sauce tied to Puebla and Tlaxcala. City restaurants imported recipes and guarded family variations for holidays. Turkey or chicken under mole anchors celebrations far beyond its origin town. CDMX dining rooms still treat mole as a prestige order.")
add("mexico-city", "Tlacoyos", "Oval masa cakes stuffed with beans or fava come from central Mexican antojito tradition. La Merced and other markets showcase tlacoyos as fuel for shoppers and workers. Toppings of salsa and nopales tie the snack to milpa ingredients. They remain a quick taste of street Indigeneity in the capital.")

# --- Bangkok ---
add("bangkok", "Pad krapow", "Holy basil stir-fry moved from home woks into street stalls as Bangkok grew. Phat kaphrao with a fried egg became the fastest lunch in office zones and transit hubs. Heat level and protein choice vary block by block. The dish is now a national symbol of quick Thai flavor.")
add("bangkok", "Tom yum goong", "Hot-sour soup with shrimp reflects central Thai herbal balance—lemongrass, galangal, lime. Royal-era recipes later mixed with street pragmatism along riverside restaurants. Bangkok exports tom yum as the global face of Thai soup. Variants noodle the broth for one-bowl meals.")
add("bangkok", "Pad Thai", "Stir-fried rice noodles were promoted in the mid-20th century as a national street food project. Bangkok Yaowarat and tourist corridors cemented wok smoke and peanut-tamarind balance as the default taste. Vendors still compete on char and noodle texture. It is deliberately urban Thai identity on a plate.")
add("bangkok", "Som tam", "Isaan mortar salad rode migration into Bangkok labor markets and night markets. Green papaya, lime, and fish sauce became a late-night craving across the capital. Spice levels scale for locals and visitors. Som tam is the most famous Isaan export served in the metropolis.")
add("bangkok", "Boat noodles", "Canal vendors once served small bowls from boats; Victory Monument later centralized the format on land. Dark five-spice broth and offal toppings define the experience. Queues honor a surviving link to khlong commerce. Bangkok still treats boat noodles as a benchmark street ritual.")
add("bangkok", "Khao soi", "Curry noodles with crispy noodles are a northern Thai specialty that Bangkok shops adopted for noodle tourists and locals alike. Coconut broth and pickle sides traveled south along migration and media. Trendy cafes now riff on the broth while respecting the Chiang Mai lineage. The capital is the easiest southern hub to find it outside the north.")
add("bangkok", "Mango sticky rice", "Sweet coconut rice with ripe mango is a seasonal dessert tied to Thai fruit culture. Night markets and Chatuchak lines made it a must-buy for visitors. Salt-kissed coconut cream balances mango perfume. Bangkok stalls turned it into Thailand sweetest-known export bite.")
add("bangkok", "Satay with peanut sauce", "Grilled skewers arrived through Malay and Muslim trade networks around the Gulf. Bangkok night bazaars paired satay with peanut-coconut dip and cucumber relish. Chicken and pork versions compete near riverside tourism. The snack shows how southern flavors met central Thai service styles.")
add("bangkok", "Khanom buang", "Crisp taco-shaped crepes come from old palace-adjacent snack traditions. Fillings split sweet coconut-foyer and savory toppings for temple fairs. Weekend markets keep khanom buang as a walking dessert. Bangkok preserves the format as a heritage sweet beside modern desserts.")

# --- New York City ---
add("new-york-city", "New York-style pizza slice", "Neapolitan immigrants adapted pizza to coal and gas ovens; slice culture scaled for commuters. Thin, foldable wedges with modest tip grease became the Manhattan default. Dollar-slice economics and borough rivalries shaped how New York eats on the move. The slice is now global shorthand for NYC food.")
add("new-york-city", "Bagel with lox", "Eastern European bagels met North American smoked fish appetizing culture on the Lower East Side. Cream cheese, capers, and onion layered into a Sunday ritual. Jewish delis made NYC the reference city for the combination. Lines still form at historic counters on weekends.")
add("new-york-city", "Pastrami on rye", "Romanian and Jewish deli techniques turned spiced brisket into a steamed, hand-carved icon. Katz and peers embedded pastrami in Lower East Side lore. Rye, mustard, and pickle became the canonical frame. Tourists treat the sandwich as edible New York history.")
add("new-york-city", "New York cheesecake", "Jewish-American bakeries developed dense, baked cheesecakes distinct from lighter European styles. Junior and neighborhood bakeries argued over crumb, tang, and height. The slice traveled worldwide as New York dessert branding. It remains a deli and diner benchmark.")
add("new-york-city", "Dirty water dog", "Street carts boiled Sabrett-style franks in spiced water for Midtown office crowds. Sauerkraut, onion, and mustard became the rushed lunch pattern. Corners still anchor that cart smell in tourist and worker memory. It is pragmatic city fuel more than gourmet ambition.")
add("new-york-city", "Soup dumplings (xiao long bao)", "Taiwanese and Shanghai diaspora cooks built dumpling scenes in Flushing and Manhattan Chinatown. Thin skins holding hot broth demand queue patience. Weekend waits map neighborhood food pilgrimage. NYC became North America high-visibility hub for the style.")
add("new-york-city", "Chicken over rice", "Halal street carts spread yellow rice, yogurt-white sauce, and hot sauce for late-night crowds. Midtown mythology around certain corners amplified the format reputation. It is immigrant entrepreneurship written as a foil-wrapped plate. The dish is now a post-club NYC staple.")
add("new-york-city", "Bacon-egg-and-cheese", "Bodegas merged breakfast sandwich logic with kaiser or hard rolls for commuters. BEC became hungover shorthand across boroughs. Every neighborhood claims a best version on a roll. It is working-class New York morning culture in wax paper.")
add("new-york-city", "Bialy", "Polish-Jewish bakers kept the onion-dimpled roll distinct from bagel boiling tradition. Lower East Side ovens preserved a niche beside denser breads. Kossar lineage still anchors how purists define the chew. It is a quieter carb icon next to the bagel.")

# --- Seoul ---
add("seoul", "Bibimbap", "Rice bowls topped with namul and gochujang reflect royal presentation simplified for home tables. Seoul restaurants and mall food courts standardized mixed-rice service for speed. Insadong tourism and Korean wave media spread the visual globally. The city remains the easiest place to taste many regional bibimbap spins.")
add("seoul", "Korean BBQ (galbi)", "Tabletop grilling expanded after urban meat supply grew; short-rib marinade with pear and soy became a hallmark. Gangnam and Mapo rooms compete on beef grade and banchan breadth. Seoul exports the all-you-can-eat template abroad. Galbi is the celebratory grill cut many visitors learn first.")
add("seoul", "Kimchi jjigae", "Aged kimchi stews turned refrigerator culture into bubbling late-night pots. Pojangmacha and 24-hour diners made jjigae the soju companion. Pork, tofu, and rice anchor the heat. Seoul nightlife still runs on shared jjigae after work.")
add("seoul", "Japchae", "Sweet potato noodles stir-fried for palace feasts shrank into party trays and holidays. Seoul homes and caterers treat japchae as a must at gatherings. Sesame and vegetable balance signal festivity. Migration spread the dish, but capital kitchens still set presentation norms.")
add("seoul", "Tteokbokki", "Rice cakes in gochujang sauce jumped from street pojang to mall food courts. Myeongdong cups-to-go made tteokbokki a student snack icon. Fish cake and egg add-ins multiplied over time. Seoul is the epicenter of spicy-chewy rice-cake culture.")
add("seoul", "Sundubu jjigae", "Soft tofu stew in a stone bowl took off in restaurant rows during the 1970s and 1980s. Seafood or pork versions anchor drinking districts after midnight. Raw egg cracked tableside finishes many bowls. The capital density of jjigae spots is unmatched nationally.")
add("seoul", "Samgyeopsal", "Thick pork belly grilled at the table became an affordable all-night protein choice. Lettuce wraps with ssamjang and garlic define the social format. Every neighborhood claims a 24-hour grill room. Seoul turned pork belly into Korean barbecue default for many foreigners.")
add("seoul", "Korean fried chicken", "Double-frying for shatter and glaze took off after the 1990s franchise boom. Sweet-spicy yangnyeom and soy-garlic variants pair with beer as chimaek culture. Seoul chains and alleys compete on crunch and sauce. The city is the global reference for the style.")
add("seoul", "Bossam", "Boiled pork belly sliced for wraps descends from celebratory sharing plates. pojang and specialty houses sell bossam trays for drinking crowds. Kimchi and ssamjang complete the bite. Late-night Seoul still moves bossam when groups want communal protein.")

# --- Atlanta ---
add("atlanta", "Lemon pepper wet wings", "Lemon-pepper seasoning met Buffalo-style wings in strip-mall kitchens across the South. Atlanta clubs and game-day culture pushed “wet” butter-glazed versions as a local flex. Strip malls turned flavor experiments into city identity. Lemon pepper is now a civic wing flavor argument.")
add("atlanta", "Southern fried chicken", "Buttermilk brine and cayenne heat traveled through Georgia Sunday tables and meat-and-threes. Atlanta restaurants debate brine time and dredge mix publicly. Fried chicken anchors soul food and upscale Southern alike. The city sits at a crossroads of national poultry styles.")
add("atlanta", "Peach cobbler", "Peach agriculture made cobblers a reunion and church-hall dessert across the state. Atlanta soul-food spots serve warm cobbler to finish meals. Biscuit versus pie topping divides families. It is the state fruit translated into comfort baking.")
add("atlanta", "Pimento cheese", "Sharp cheddar spread with mayo and jarred pimentos became a Southern tea-room staple. Atlanta delis sell tubs for tailgates and sandwiches. The spread bridges crackers, burgers, and fried chicken. It is a portable taste of Upper South hospitality.")
add("atlanta", "Biscuits and gravy", "Flaky biscuits and sausage cream gravy anchor Southern breakfast diners. Atlanta brunch lines test gravy pepper and biscuit height. Weekend family traffic keeps diners busy. The plate maps Scots-Irish flour culture through Southern pork processing.")
add("atlanta", "Shrimp and grits", "Lowcountry shrimp met inland grit mills as coastal trade moved up rivers. Atlanta brunch menus reinterpret the dish with bacon and stock. Upscale takes sit beside simpler plates. It shows how Georgia connects coast and capital on one bowl.")
add("atlanta", "Pulled pork sandwich", "Pit-smoked shoulder with slaw reflects Georgia barbecue belt mixing vinegar and tomato-leaning sauces. Atlanta competition BBQ influences neighborhood joints. Sandwiches make the meat portable for festivals. The city debates bark versus sauce balance like any smoke town.")
add("atlanta", "Sweet tea", "Black tea sweetened while hot became a hospitality default when ice became cheap. Meat-and-threes pour it by the pitcher alongside fried mains. Sugar concentration is a point of pride. Sweet tea is the background beverage of Georgia dining rooms.")
add("atlanta", "Brunswick stew", "Hunting-camp pots of tomato, corn, lima beans, and smoked meat drifted across the Southeast with disputed origin stories. Georgia smokehouses simmer overnight batches as a side ritual. Atlanta tables encounter it beside barbecue trays. It is a regional stew that signals gathering and leftovers.")

# --- Austin ---
add("austin", "Breakfast tacos", "Flour and corn tortillas filled with eggs, cheese, and potatoes rode Tex-Mex trailer culture along I-35. Austin morning lines made breakfast tacos the city on-the-go meal. South Lamar and airport-adjacent trailers cemented devotion. The format is now Austin morning identity.")
add("austin", "Texas brisket", "Central Texas post-oak smoke and salt-and-pepper bark set a minimalist barbecue standard. Franklin-era queues globalized Austin as a brisket pilgrimage. Slices are judged on smoke ring and tenderness without heavy sauce. Hill Country pits influenced how the city markets smoke.")
add("austin", "Beef ribs", "Massive beef plate ribs showcase patience and bark outside pork-heavy styles. East Austin pits use weekend specials to flex size and smoke time. Beef rib culture overlaps with Central Texas traditions. Visitors compare black bark across competing smokers.")
add("austin", "Sausage links", "Czech and German smokehouse links fused with jalapeño-cheddar and Tex spice along the barbecue belt. Lockhart lineage influences Austin counters through migration and rivalry. Jalapeño links sit beside brisket trays. The city samples Central Texas sausage diversity in one metro.")
add("austin", "Pulled pork", "East Texas saucier styles meet Hill Country dry rub on shoulder cooks. Food trucks plate pulled pork sliders at festivals with slaw. Vinegar and tomato sauces split preferences by neighborhood. Austin sits between sauce cultures on the Texas map.")
add("austin", "Queso fundido", "Melted cheese with chiles belongs to border Tex-Mex parlors that patio culture amplified. Austin patios pair queso with margaritas nightly. Chips become the vehicle for communal dipping. Riverside Tex-Mex history still shapes local expectations.")
add("austin", "Kolaches", "Czech immigrants baked fruit and sausage kolaches along Central Texas I-35 towns. Austin bakeries merged sweet and savory fillings for commuters. Kolaches function as road-trip breakfast fuel. The city is a southern end of the Czech-Tex pastry trail.")
add("austin", "Banana pudding", "Layered pudding, bananas, and wafers followed church potlucks and smokehouse dessert menus. Trailers sell cups after brisket trays as a cooling sweet. Nostalgia keeps cups in foil pans. It is the Southern dessert epilogue after smoke.")
add("austin", "Frito pie", "Chili and cheese poured into a Fritos bag came from fairgrounds and school concessions. Texas high-school football culture spread the walking format. Rodeo nights still serve the bag as edible nostalgia. Austin festivals keep the crunch-and-chili ritual alive.")

# --- Chicago ---
add("chicago", "Chicago deep-dish pizza", "Mid-century Chicago pizzerias layered cheese, fillings, and chunky sauce in a buttered deep pan for a fork-and-knife meal. Tourists and locals argue whether it beats tavern-cut thin for everyday eating. The style is now a civic trademark alongside New York and Neapolitan narratives. Deep-dish tours anchor food travel itineraries.")
add("chicago", "Italian beef", "Thin-sliced seasoned beef on a roll with giardiniera or sweet peppers grew from South Side stands serving factory crowds. Dipping the sandwich in jus became a rite; sausage combos layered indulgence. Italian beef is a Chicago sandwich genre more than a generic sub. Locals rank stands by juice and spice bite.")
add("chicago", "Chicago hot dog", "Depression-era stands loaded all-beef dogs with mustard, relish, onion, tomato, pickle, sport pepper, and celery salt—never ketchup. Poppy-seed buns and neon-green relish signal authenticity. Every neighborhood defends a favorite stand. The dog is a designed city icon down to the toppings order.")
add("chicago", "Jibarito", "Puerto Rican Chicago cooks swapped bread for fried plantains to build steak sandwiches with lettuce and mayo. Humboldt Park lines trace neighborhood pride in the format. The jibarito is a city invention rarely found elsewhere at scale. It maps Caribbean migration onto midwestern sandwich logic.")
add("chicago", "Maxwell Street Polish", "Grilled Polish sausage with mustard and onions came from the old Maxwell Street market feeding industrial workers. Late-night windows still sell the smoky link on a roll. It is a South Side craving tied to market memory. The sandwich survived redevelopment through stand loyalty.")
add("chicago", "Tavern-style thin crust", "Cracker-thin square-cut pizza with fennel sausage spread through South Side taverns as a party-cut alternative to deep dish. Locals often prefer it for weeknight eating over heavier pies. Cheese and sausage ratios differ by bar. It is the everyday Chicago pizza style tourists overlook.")
add("chicago", "Garrett-style popcorn mix", "Cheese and caramel popcorn blends became souvenir tins from State Street shops and airport kiosks. Sweet-salty mixing turned a snack into gift culture. Holiday tins still ship nationwide from Chicago brands. The mix is a modern retail story atop older popcorn street sales.")
add("chicago", "Italian lemon ice", "Italian-American pushcarts scooped lemon ice to cool lakefront summers before air conditioning. Little Italy street festivals keep paper cups of ice as a seasonal ritual. It is a simple immigrant refreshment that survived as festival food. Scoops still signal summer neighborhood fairs.")
add("chicago", "Malört shot", "Swedish-style bitter wormwood liqueur was adopted as Chicago bar hazing and pride. Bartenders pour it for initiates and skeptics alike, often with a pickle back. The flavor is divisive by design. Malört is less about taste than about belonging to an in-joke.")


def main() -> None:
    text = SEED.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    out: list[str] = []
    for line in lines:
        # After ingredients: array[...]::text[],'short_history'::text,'regional'::text,
        m = re.match(
            r"^(\s*\('([a-z-]+)'::text,'((?:[^']|'')+)'::text,'(?:[^']|'')+'::text,array\[.*?\]::text\[\],)'(?:[^']|'')*'::text,'(?:[^']|'')*'::text,((?:true|false)::boolean,(?:true|false)::boolean,.*)$",
            line,
        )
        if not m:
            out.append(line)
            continue
        prefix, city, name_raw, tail = m.group(1), m.group(2), m.group(3), m.group(4)
        name = name_raw.replace("''", "'")
        key = f"{city}|{name}"
        if key not in HIST:
            raise SystemExit(f"Missing history for {key!r}")
        hist = HIST[key]
        new_line = f"{prefix}'{hist}'::text,null::text,{tail}"
        out.append(new_line)

    SEED.write_text("".join(out), encoding="utf-8")
    print(f"Patched {len(HIST)} rows in {SEED}")


if __name__ == "__main__":
    main()
