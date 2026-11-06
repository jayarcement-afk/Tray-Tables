"use client";

import { useEffect, useMemo, useState } from "react";

import canonicalCities from "@/data/canonical-cities.json";

type CityRow = (typeof canonicalCities.cities)[number];

const ALL_CITIES: CityRow[] = canonicalCities.cities;

function labelCity(c: CityRow) {
  return `${c.name}, ${c.country}`;
}

export function NewTripForm() {
  const [query, setQuery] = useState("");
  const [citySlug, setCitySlug] = useState(ALL_CITIES[0]?.slug ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCities = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_CITIES;
    return ALL_CITIES.filter((c) => labelCity(c).toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (filteredCities.length === 0) return;
    if (!filteredCities.some((c) => c.slug === citySlug)) {
      setCitySlug(filteredCities[0].slug);
    }
  }, [query, citySlug, filteredCities]);

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ citySlug }),
      });
      const json = (await res.json()) as { tripId?: string; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to create trip");
      if (!json.tripId) throw new Error("Missing trip id");
      window.location.href = `/trips/${json.tripId}/dishes`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-bold text-zinc-900">Search city</span>
        <input
          className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. Tokyo, Austin…"
        />
      </label>
      <div className="mt-3">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">City</span>
          <select
            className="h-11 max-w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={citySlug}
            onChange={(e) => setCitySlug(e.target.value)}
          >
            {filteredCities.map((c) => (
              <option key={c.slug} value={c.slug}>
                {labelCity(c)}
              </option>
            ))}
          </select>
        </label>
        {filteredCities.length === 0 ? (
          <p className="mt-1 text-sm text-amber-800">
            No city matches. Clear the search.
          </p>
        ) : null}
      </div>
      {error ? (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50"
          onClick={() => {
            window.location.href = "/trips";
          }}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={
            busy ||
            filteredCities.length === 0 ||
            !citySlug
          }
          onClick={handleCreate}
        >
          Create trip
        </button>
      </div>
    </div>
  );
}
