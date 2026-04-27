/**
 * Hero images for trip destinations — Wikimedia Commons (see each file page for license).
 * Keys match `public.cities.slug`.
 */
export const CITY_BANNERS: Record<
  string,
  { url: string; attribution: string }
> = {
  tokyo: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b2/Skyscrapers_of_Shinjuku_2009_January.jpg/1920px-Skyscrapers_of_Shinjuku_2009_January.jpg",
    attribution: "Wikimedia Commons — Skyscrapers of Shinjuku",
  },
  paris: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg/1920px-La_Tour_Eiffel_vue_de_la_Tour_Saint-Jacques%2C_Paris_ao%C3%BBt_2014_%282%29.jpg",
    attribution: "Wikimedia Commons — Eiffel Tower, Paris",
  },
  "mexico-city": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg/1920px-Sobrevuelos_CDMX_HJ2A4913_%2825514321687%29_%28cropped%29.jpg",
    attribution: "Wikimedia Commons — Mexico City aerial",
  },
  bangkok: {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/02/Bangkok_Montage_2024_2.jpg",
    attribution: "Wikimedia Commons — Bangkok montage",
  },
  "new-york-city": {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg/1920px-View_of_Empire_State_Building_from_Rockefeller_Center_New_York_City_dllu_%28cropped%29.jpg",
    attribution: "Wikimedia Commons — New York City",
  },
  seoul: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg/1920px-%EC%A4%91%ED%99%94%EC%A0%84%EC%9D%98_%EB%82%AE.jpg",
    attribution: "Wikimedia Commons — Seoul",
  },
  atlanta: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/A2ATL20250614-0721_%28cropped%29.jpg/1920px-A2ATL20250614-0721_%28cropped%29.jpg",
    attribution: "Wikimedia Commons — Atlanta",
  },
  "abu-dhabi": {
    url: "https://images.unsplash.com/photo-1590140568849-f27028e1f822?auto=format&fit=crop&w=3000&q=60",
    attribution: "Unsplash — Abu Dhabi skyline by Belinda Fewings",
  },
  "abu-dhabi-united-arab-emirates": {
    url: "https://images.unsplash.com/photo-1590140568849-f27028e1f822?auto=format&fit=crop&w=3000&q=60",
    attribution: "Unsplash — Abu Dhabi skyline by Belinda Fewings",
  },
  austin: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Austin_Downtown_2024.jpg/1920px-Austin_Downtown_2024.jpg",
    attribution: "Wikimedia Commons — Austin downtown",
  },
  chicago: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Chicago_River_ferry_b.jpg/1920px-Chicago_River_ferry_b.jpg",
    attribution: "Wikimedia Commons — Chicago River",
  },
  seattle: {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Seattle_skyline_2021.jpg",
    attribution: "Wikimedia Commons — Seattle skyline",
  },
  "seattle-united-states": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/eb/Seattle_skyline_2021.jpg",
    attribution: "Wikimedia Commons — Seattle skyline",
  },
  amsterdam: {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/22/Amsterdam_Skyline_View.jpg",
    attribution: "Wikimedia Commons — Amsterdam skyline",
  },
  "amsterdam-netherlands": {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/22/Amsterdam_Skyline_View.jpg",
    attribution: "Wikimedia Commons — Amsterdam skyline",
  },
  venice: {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/9b/SkylineVenice.jpg",
    attribution: "Wikimedia Commons — Venice skyline",
  },
  "venice-italy": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/9b/SkylineVenice.jpg",
    attribution: "Wikimedia Commons — Venice skyline",
  },
  lisbon: {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/28/Lisbon_Skyline_%2845684560521%29.jpg",
    attribution: "Wikimedia Commons — Lisbon skyline",
  },
  "lisbon-portugal": {
    url: "https://upload.wikimedia.org/wikipedia/commons/2/28/Lisbon_Skyline_%2845684560521%29.jpg",
    attribution: "Wikimedia Commons — Lisbon skyline",
  },
  "amalfi-italy": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/08/Amalfi_sea_view_Italy.JPG",
    attribution: "Wikimedia Commons — Amalfi city view",
  },
  "antigua-guatemala": {
    url: "https://upload.wikimedia.org/wikipedia/commons/7/71/St_Johns_Antigua_2012.jpg",
    attribution: "Wikimedia Commons — Antigua city view",
  },
  "athens-greece": {
    url: "https://upload.wikimedia.org/wikipedia/commons/7/74/Monastiraki_Square_and_Acropolis_in_Athens_%2844149181684%29.jpg",
    attribution: "Wikimedia Commons — Monastiraki Square and Acropolis, Athens",
  },
  "auckland-new-zealand": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f8/01_Auckland_New_Zealand-1000137.jpg",
    attribution: "Wikimedia Commons — Auckland city view",
  },
  "barcelona-spain": {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/5d/Aerial_view_of_Barcelona%2C_Spain_%2851227309370%29_edited.jpg",
    attribution: "Wikimedia Commons — Barcelona city view",
  },
  "beijing-china": {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/6a/%E7%9A%87%E5%9F%8E3.jpg",
    attribution: "Wikimedia Commons — Beijing city view",
  },
  "belfast-united-kingdom": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/90/Belfast_City_Hospital.jpg",
    attribution: "Wikimedia Commons — Belfast city view",
  },
  "berlin-germany": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Oberbaumbr%C3%BCcke_mit_U-Bahn.jpg",
    attribution: "Wikimedia Commons — Berlin city view",
  },
  "boracay-philippines": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Mandurriao_Iloilo_City_skyline_2025_%28enhanced%29.jpg",
    attribution: "Wikimedia Commons — Boracay city view",
  },
  "boston-united-states": {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/be/Boston_Back_Bay_skyline_by_Chris_Rycroft.jpg",
    attribution: "Wikimedia Commons — Boston city view",
  },
  "brisbane-australia": {
    url: "https://upload.wikimedia.org/wikipedia/commons/0/0f/Brisbane_CBD_seen_from_Kangaroo_Point%2C_2024%2C_01_%282%29.jpg",
    attribution: "Wikimedia Commons — Brisbane city view",
  },
  "brussels-belgium": {
    url: "https://upload.wikimedia.org/wikipedia/commons/a/ae/Grand_Place_Bruselas_2.jpg",
    attribution: "Wikimedia Commons — Brussels city view",
  },
  "budapest-hungary": {
    url: "https://upload.wikimedia.org/wikipedia/commons/5/53/View_from_Gell%C3%A9rt_Hill_to_the_Danube%2C_Hungary_-_Budapest_%2828493220635%29.jpg",
    attribution: "Wikimedia Commons — Budapest city view",
  },
  "buenos-aires-argentina": {
    url: "https://upload.wikimedia.org/wikipedia/commons/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg",
    attribution: "Wikimedia Commons — Buenos Aires city view",
  },
  "cartagena-colombia": {
    url: "https://upload.wikimedia.org/wikipedia/commons/3/30/Museo_Naval_del_Caribe.JPG",
    attribution: "Wikimedia Commons — Cartagena city view",
  },
  "cebu-city-philippines": {
    url: "https://upload.wikimedia.org/wikipedia/commons/b/b5/Cebu_city_skyline_2025.jpg",
    attribution: "Wikimedia Commons — Cebu City city view",
  },
  "chiang-mai-thailand": {
    url: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Ayutthaya_Historical_Park_%2849814043183%29.jpg",
    attribution: "Wikimedia Commons — Chiang Mai city view",
  },
  "copenhagen-denmark": {
    url: "https://upload.wikimedia.org/wikipedia/commons/1/15/2018_-_Christiansborg_from_the_Marble_Bridge.jpg",
    attribution: "Wikimedia Commons — Copenhagen city view",
  },
  "da-nang-vietnam": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f4/Ho_Chi_Minh_City_panorama_2019_%28cropped2%29.jpg",
    attribution: "Wikimedia Commons — Da Nang city view",
  },
  "delhi-india": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/fe/Forecourt%2C_Rashtrapati_Bhavan_-_1.jpg",
    attribution: "Wikimedia Commons — Delhi city view",
  },
  "denpasar-bali-indonesia": {
    url: "https://upload.wikimedia.org/wikipedia/commons/f/f8/Aerial_view_of_Bajra_Sandhi_Monument_Denpasar_Bali_Indonesia.jpg",
    attribution: "Wikimedia Commons — Denpasar city view",
  },
  "doha-qatar": {
    url: "https://upload.wikimedia.org/wikipedia/commons/e/ee/Dubai_Towers%2C_Doha.jpg",
    attribution: "Wikimedia Commons — Doha city view",
  },
  "dubai-united-arab-emirates": {
    url: "https://upload.wikimedia.org/wikipedia/en/c/c7/Burj_Khalifa_2021.jpg",
    attribution: "Wikimedia Commons — Dubai city view",
  },
  "dublin-ireland": {
    url: "https://upload.wikimedia.org/wikipedia/commons/9/92/Dublin_-_aerial_-_2025-07-07_01.jpg",
    attribution: "Wikimedia Commons — Dublin city view",
  },
  "dubrovnik-croatia": {
    url: "https://upload.wikimedia.org/wikipedia/commons/6/67/The_walls_of_the_fortress_and_View_of_the_old_city._panorama.jpg",
    attribution: "Wikimedia Commons — Dubrovnik city view",
  },
};

export function getCityBanner(slug: string | null | undefined) {
  if (!slug) return null;
  const direct = CITY_BANNERS[slug];
  if (direct) return direct;

  // Some city slugs include country suffixes (e.g. "seattle-united-states")
  // while banner keys may use the base city slug ("seattle").
  const base = slug.split("-")[0];
  if (!base) return null;
  return CITY_BANNERS[base] ?? null;
}

/** Same allowlist as `/api/dish-image` — use for server-rendered thumbs and client fallbacks. */
export function proxiedBannerImageUrl(original: string): string | null {
  const t = original.trim();
  if (
    t.startsWith("https://images.unsplash.com/") ||
    t.startsWith("https://upload.wikimedia.org/") ||
    t.startsWith("https://placehold.co/")
  ) {
    return `/api/dish-image?u=${encodeURIComponent(t)}`;
  }
  return null;
}
