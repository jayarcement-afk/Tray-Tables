import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

/** Same-origin proxy: browser → Nominatim is often blocked (CORS → "Failed to fetch"). */
const NOMINATIM_UA = "TrayTables/1.0 (trip planner restaurant map)";
const PHOTON_UA = "TrayTables/1.0 (trip planner geocode fallback)";

export const QUERY_KEY_MAX = 500;
/** Long "restaurant + street + city + country" strings must not be rejected here. */
const MAX_QUERY_IN = 1800;

async function nominatimSearch(q: string): Promise<{ lat: number; lon: number } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`;

  async function once(): Promise<Response | null> {
    try {
      return await fetch(url, {
        headers: { "User-Agent": NOMINATIM_UA },
        cache: "no-store",
      });
    } catch {
      return null;
    }
  }

  let res = await once();
  if (res?.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await once();
  }
  if (!res?.ok) return null;

  const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
  const row = rows[0];
  if (!row) return null;
  const lat = Number(row.lat);
  const lon = Number(row.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
}

/** Fallback when Nominatim is empty, rate-limited, or blocks datacenter IPs (common on serverless). */
async function photonSearch(q: string): Promise<{ lat: number; lon: number } | null> {
  const trimmed = q.slice(0, 2000);
  const url = `https://photon.komoot.io/api?q=${encodeURIComponent(trimmed)}&limit=1`;
  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": PHOTON_UA },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      features?: Array<{ geometry?: { type?: string; coordinates?: unknown } }>;
    };
    const coords = data.features?.[0]?.geometry?.coordinates;
    if (!Array.isArray(coords) || coords.length < 2) return null;
    const lon = Number(coords[0]);
    const lat = Number(coords[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (!q || q.length > MAX_QUERY_IN) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const queryKey = q.slice(0, QUERY_KEY_MAX);

  try {
    const supabase = await createSupabaseServerClient();
    const { data: cached, error } = await supabase
      .from("restaurant_map_coordinates")
      .select("lat, lon")
      .eq("query_key", queryKey)
      .maybeSingle();

    if (!error && cached) {
      const lat = Number((cached as { lat?: unknown }).lat);
      const lon = Number((cached as { lon?: unknown }).lon);
      if (Number.isFinite(lat) && Number.isFinite(lon)) {
        return NextResponse.json({ lat, lon, source: "database" });
      }
    }
  } catch {
    // Missing table or client error — fall through to Nominatim.
  }

  let hit = await nominatimSearch(q);
  let source: "nominatim" | "photon" = "nominatim";
  if (!hit) {
    const photon = await photonSearch(q);
    if (!photon) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    hit = photon;
    source = "photon";
  }

  const admin = createSupabaseServiceRoleClient();
  if (admin) {
    const { error: upErr } = await admin.from("restaurant_map_coordinates").upsert(
      {
        query_key: queryKey,
        lat: hit.lat,
        lon: hit.lon,
        source,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "query_key" }
    );
    if (upErr) {
      // Still return coordinates to the client; cache write is best-effort.
      console.warn("[geocode] upsert restaurant_map_coordinates:", upErr.message);
    }
  }

  return NextResponse.json({ lat: hit.lat, lon: hit.lon, source });
}
