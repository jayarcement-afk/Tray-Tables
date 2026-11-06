"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

import { USER_DISH_ID_PREFIX } from "@/lib/trip-custom-dishes";

export type MapPoint = {
  key: string;
  label: string;
  query: string;
  mapUrl: string;
  /** Shown in the pin popup when present. */
  address?: string | null;
  /** When both set, skips geocoding (e.g. parsed from a Google Maps link). */
  lat?: number;
  lon?: number;
  /** Additional `/api/geocode?q=` strings to try if `query` returns no hit (user-added stops). */
  extraGeocodeQueries?: string[];
};

type Geocoded = MapPoint & { lat: number; lon: number };

type Props = {
  cityName: string;
  /** Used as a second geocode try for stops with a street address. */
  cityCountry: string;
  points: MapPoint[];
};

const CACHE_KEY = "trip-map-geocode-cache:v1";
/** Nominatim-friendly: a few parallel calls via our proxy, not a burst of dozens. */
const GEOCODE_CONCURRENCY = 4;
const GEOCODE_FETCH_MS = 7000;

/** Leaflet default marker PNG paths break under Next/Turbopack; CSS pin avoids broken icons. */
function createTripMarkerIcon(L: typeof import("leaflet")) {
  return L.divIcon({
    html: `<span style="display:block;width:12px;height:12px;background:#18181b;border:2px solid #fff;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.35)"></span>`,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 22],
    popupAnchor: [0, -20],
  });
}

function geocodeFallbackQuery(address: string, cityName: string, cityCountry: string): string {
  const a = address.trim();
  const city = cityName.trim();
  const country = cityCountry.trim();
  return [a, city, country].filter(Boolean).join(", ");
}

function orderedGeocoded(uniquePoints: MapPoint[], byKey: Map<string, Geocoded>): Geocoded[] {
  const out: Geocoded[] = [];
  for (const p of uniquePoints) {
    const g = byKey.get(p.key);
    if (g) out.push(g);
  }
  return out;
}

async function fetchGeocodeCoords(
  query: string,
  externalSignal: AbortSignal | undefined
): Promise<{ lat: number; lon: number } | null> {
  const timeoutCtl = new AbortController();
  const id = setTimeout(() => timeoutCtl.abort(), GEOCODE_FETCH_MS);
  const onParentAbort = () => timeoutCtl.abort();
  externalSignal?.addEventListener("abort", onParentAbort);

  let res: Response;
  try {
    res = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`, {
      signal: timeoutCtl.signal,
    });
  } catch {
    return null;
  } finally {
    clearTimeout(id);
    externalSignal?.removeEventListener("abort", onParentAbort);
  }
  if (!res.ok) return null;
  let body: { lat?: number; lon?: number };
  try {
    body = (await res.json()) as { lat?: number; lon?: number };
  } catch {
    return null;
  }
  const lat = body.lat;
  const lon = body.lon;
  if (typeof lat !== "number" || typeof lon !== "number" || !Number.isFinite(lat) || !Number.isFinite(lon)) {
    return null;
  }
  return { lat, lon };
}

async function resolvePointFromNetwork(
  p: MapPoint,
  cityName: string,
  cityCountry: string,
  cache: Record<string, { lat: number; lon: number }>,
  signal: AbortSignal
): Promise<Geocoded | null> {
  let coords = await fetchGeocodeCoords(p.query, signal);
  if (
    !coords &&
    p.address?.trim() &&
    (cityName.trim() || cityCountry.trim())
  ) {
    const fb = geocodeFallbackQuery(p.address, cityName, cityCountry);
    if (fb !== p.query.trim()) {
      coords = await fetchGeocodeCoords(fb, signal);
      if (coords) {
        cache[p.query] = coords;
      }
    }
  }
  if (!coords && p.extraGeocodeQueries?.length) {
    for (const q of p.extraGeocodeQueries) {
      if (signal.aborted) break;
      const t = q.trim();
      if (!t || t === p.query.trim()) continue;
      coords = await fetchGeocodeCoords(t, signal);
      if (coords) {
        cache[p.query] = coords;
        break;
      }
    }
  }
  // Last resort: trip city anchor from map props (row city/country can be empty or wrong).
  if (!coords && p.key.startsWith(USER_DISH_ID_PREFIX)) {
    const anchor = [cityName.trim(), cityCountry.trim()].filter(Boolean).join(", ");
    if (anchor) {
      const tried = new Set<string>([p.query.trim(), ...(p.extraGeocodeQueries ?? []).map((x) => x.trim())]);
      if (!tried.has(anchor)) {
        coords = await fetchGeocodeCoords(anchor, signal);
        if (coords) cache[p.query] = coords;
      }
    }
  }
  if (!coords) return null;
  if (!cache[p.query]) {
    cache[p.query] = coords;
  }
  return { ...p, lat: coords.lat, lon: coords.lon };
}

/**
 * Run async tasks with limited concurrency (round-robin workers pulling from a shared index).
 */
async function runPool<T>(
  items: T[],
  concurrency: number,
  signal: AbortSignal,
  worker: (item: T) => Promise<void>
): Promise<void> {
  if (items.length === 0) return;
  const n = Math.max(1, Math.min(concurrency, items.length));
  let next = 0;
  async function pull() {
    while (!signal.aborted) {
      const i = next++;
      if (i >= items.length) break;
      await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: n }, () => pull()));
}

export function TripRestaurantsMap({ cityName, cityCountry, points }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [geocoded, setGeocoded] = useState<Geocoded[]>([]);
  /** True only while the first batch (cache + preset) is not yet applied, or initial empty. */
  const [bootstrapping, setBootstrapping] = useState(false);
  const [networkPending, setNetworkPending] = useState(0);

  const uniquePoints = useMemo(() => {
    const m = new Map<string, MapPoint>();
    for (const p of points) m.set(p.key, p);
    return [...m.values()];
  }, [points]);

  useEffect(() => {
    const abort = new AbortController();
    const { signal } = abort;

    async function run() {
      if (uniquePoints.length === 0) {
        setGeocoded([]);
        setBootstrapping(false);
        setNetworkPending(0);
        return;
      }

      setBootstrapping(true);
      setNetworkPending(0);

      const cacheRaw = window.localStorage.getItem(CACHE_KEY);
      let cache: Record<string, { lat: number; lon: number }> = {};
      try {
        cache = cacheRaw ? (JSON.parse(cacheRaw) as Record<string, { lat: number; lon: number }>) : {};
      } catch {
        cache = {};
      }

      const byKey = new Map<string, Geocoded>();
      const needNetwork: MapPoint[] = [];

        for (const p of uniquePoints) {
        if (signal.aborted) return;

        const presetLat = p.lat;
        const presetLon = p.lon;
        if (
          typeof presetLat === "number" &&
          typeof presetLon === "number" &&
          Number.isFinite(presetLat) &&
          Number.isFinite(presetLon)
        ) {
          byKey.set(p.key, { ...p, lat: presetLat, lon: presetLon });
          continue;
        }

          const hit = cache[p.query];
          if (hit) {
          byKey.set(p.key, { ...p, lat: hit.lat, lon: hit.lon });
            continue;
          }

        needNetwork.push(p);
      }

      // Show cache + preset pins immediately (no network wait).
      setGeocoded(orderedGeocoded(uniquePoints, byKey));
      setBootstrapping(false);
      setNetworkPending(needNetwork.length);

      if (needNetwork.length === 0) {
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        } catch {
          // ignore
        }
        return;
      }

      await runPool(needNetwork, GEOCODE_CONCURRENCY, signal, async (p) => {
        if (signal.aborted) return;
        const geo = await resolvePointFromNetwork(p, cityName, cityCountry, cache, signal);
        if (!signal.aborted && geo) byKey.set(p.key, geo);
      });

      if (signal.aborted) return;

      setGeocoded(orderedGeocoded(uniquePoints, byKey));
      setNetworkPending(0);

      try {
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
      } catch {
        // ignore quota / private mode
      }
    }

    void run();
    return () => abort.abort();
  }, [uniquePoints, cityName, cityCountry]);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let isDisposed = false;
    async function render() {
      if (!mapRef.current) return;
      const L = await import("leaflet");
      if (isDisposed || !mapRef.current) return;

      map = L.map(mapRef.current, { zoomControl: true });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(map);

      const pinIcon = createTripMarkerIcon(L);
      const bounds: [number, number][] = [];
      if (geocoded.length > 0) {
        geocoded.forEach((p) => {
          bounds.push([p.lat, p.lon]);
          const addrLine = p.address?.trim()
            ? `<br/><span style="font-size:12px;color:#52525b">${escapeHtml(p.address.trim())}</span>`
            : "";
          L.marker([p.lat, p.lon], { icon: pinIcon })
            .addTo(map!)
            .bindPopup(
              `<div><strong>${escapeHtml(p.label)}</strong>${addrLine}<br/><a href="${escapeHtml(p.mapUrl)}" target="_blank" rel="noopener noreferrer">Open in maps</a></div>`
            );
        });
        map.fitBounds(bounds, { padding: [24, 24] });
      } else {
        map.setView([20, 0], 2);
      }
    }
    void render();
    return () => {
      isDisposed = true;
      if (map) map.remove();
    };
  }, [geocoded]);

  return (
    <div>
      <div ref={mapRef} className="h-72 w-full" />
      {bootstrapping ? (
        <p className="mt-2 text-xs text-zinc-500">Loading map…</p>
      ) : networkPending > 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          Fetching {networkPending} more pin{networkPending === 1 ? "" : "s"}…
        </p>
      ) : geocoded.length < uniquePoints.length ? (
        <p className="mt-2 text-xs text-zinc-500">
          Showing {geocoded.length} of {uniquePoints.length} restaurants with map coordinates.
        </p>
      ) : null}
      {uniquePoints.length === 0 ? (
        <p className="mt-2 text-xs text-zinc-500">
          No selected restaurants yet for this trip.
        </p>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">City: {cityName}</p>
    </div>
  );
}

function escapeHtml(input: string): string {
  return input
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
