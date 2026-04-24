"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";

type Point = {
  key: string;
  label: string;
  query: string;
  mapUrl: string;
};

type Geocoded = Point & { lat: number; lon: number };

type Props = {
  cityName: string;
  points: Point[];
};

const CACHE_KEY = "trip-map-geocode-cache:v1";

export function TripRestaurantsMap({ cityName, points }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [geocoded, setGeocoded] = useState<Geocoded[]>([]);
  const [loading, setLoading] = useState(false);

  const uniquePoints = useMemo(() => {
    const m = new Map<string, Point>();
    for (const p of points) m.set(p.key, p);
    return [...m.values()];
  }, [points]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (uniquePoints.length === 0) {
        setGeocoded([]);
        return;
      }
      setLoading(true);
      try {
        const cacheRaw = window.localStorage.getItem(CACHE_KEY);
        const cache = cacheRaw ? (JSON.parse(cacheRaw) as Record<string, { lat: number; lon: number }>) : {};
        const resolved: Geocoded[] = [];
        for (const p of uniquePoints) {
          const hit = cache[p.query];
          if (hit) {
            resolved.push({ ...p, lat: hit.lat, lon: hit.lon });
            continue;
          }
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(p.query)}`
          );
          if (!res.ok) continue;
          const rows = (await res.json()) as Array<{ lat: string; lon: string }>;
          if (!rows[0]) continue;
          const lat = Number(rows[0].lat);
          const lon = Number(rows[0].lon);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
          cache[p.query] = { lat, lon };
          resolved.push({ ...p, lat, lon });
        }
        window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
        if (!cancelled) setGeocoded(resolved);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [uniquePoints]);

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

      const bounds: [number, number][] = [];
      if (geocoded.length > 0) {
        geocoded.forEach((p) => {
          bounds.push([p.lat, p.lon]);
          L.marker([p.lat, p.lon])
            .addTo(map!)
            .bindPopup(
              `<div><strong>${escapeHtml(p.label)}</strong><br/><a href="${p.mapUrl}" target="_blank" rel="noopener noreferrer">Open in maps</a></div>`
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
      {loading ? (
        <p className="mt-2 text-xs text-zinc-500">Placing restaurant pins...</p>
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
