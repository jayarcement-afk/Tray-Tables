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
  austin: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Austin_Downtown_2024.jpg/1920px-Austin_Downtown_2024.jpg",
    attribution: "Wikimedia Commons — Austin downtown",
  },
  chicago: {
    url: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Chicago_River_ferry_b.jpg/1920px-Chicago_River_ferry_b.jpg",
    attribution: "Wikimedia Commons — Chicago River",
  },
};

export function getCityBanner(slug: string | null | undefined) {
  if (!slug) return null;
  return CITY_BANNERS[slug] ?? null;
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
