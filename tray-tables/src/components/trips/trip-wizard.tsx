"use client";

import { useEffect, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type City = { id: string; name: string; country: string | null; slug: string | null };

const MEALS = [
  { id: "breakfast", label: "Breakfast" },
  { id: "lunch", label: "Lunch" },
  { id: "dinner", label: "Dinner" },
  { id: "late_night", label: "Late night" },
  { id: "street_food", label: "Street food" },
  { id: "snack", label: "Snack" },
] as const;

type MealId = (typeof MEALS)[number]["id"];

function daysBetweenInclusive(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  const days = Math.floor((e.getTime() - s.getTime()) / 86_400_000) + 1;
  return days;
}

export function TripWizard({
  initialCities,
  queryError,
}: {
  initialCities: City[];
  queryError?: string | null;
}) {
  const [cities, setCities] = useState<City[]>(initialCities);
  const [cityId, setCityId] = useState(initialCities[0]?.id ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [mealTypes, setMealTypes] = useState<MealId[]>(["breakfast", "lunch", "dinner"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(queryError ?? null);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    setCities(initialCities);
    if (initialCities[0]?.id) setCityId(initialCities[0].id);
  }, [initialCities]);

  useEffect(() => {
    if (initialCities.length > 0) return;

    let cancelled = false;
    setLoadingCities(true);
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      if (!cancelled) {
        setLoadingCities(false);
        setLoadError("App configuration is incomplete.");
      }
      return;
    }

    void supabase
      .from("cities")
      .select("id,name,country,slug")
      .order("name", { ascending: true })
      .then(({ data, error: clientErr }) => {
        if (cancelled) return;
        setLoadingCities(false);
        if (clientErr) {
          setLoadError(clientErr.message);
          return;
        }
        if (data?.length) {
          setCities(data);
          setCityId(data[0].id);
          setLoadError(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [initialCities.length]);

  const tripDays = (() => {
    if (!startDate || !endDate) return null;
    return daysBetweenInclusive(startDate, endDate);
  })();

  function toggleMeal(meal: MealId) {
    setMealTypes((prev) =>
      prev.includes(meal) ? prev.filter((m) => m !== meal) : [...prev, meal]
    );
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ cityId, startDate, endDate, mealTypes }),
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

  const invalidLength = tripDays !== null && (tripDays < 1 || tripDays > 14);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {loadError ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          <span className="font-medium">Could not load cities: </span>
          {loadError}
        </div>
      ) : null}

      {!loadError && !loadingCities && cities.length === 0 ? (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <span className="font-medium">No cities in the database.</span> In the Supabase SQL
          editor, run <code className="rounded bg-amber-100 px-1">seed.sql</code> (after{" "}
          <code className="rounded bg-amber-100 px-1">schema.sql</code>), then refresh this page.
          Also run <code className="rounded bg-amber-100 px-1">grants-reference-data.sql</code> if
          the API still returns nothing.
        </div>
      ) : null}

      {loadingCities && cities.length === 0 ? (
        <div className="mb-4 text-sm text-zinc-600">Loading cities…</div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Destination city</span>
          <select
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={cityId}
            onChange={(e) => setCityId(e.target.value)}
            disabled={cities.length === 0}
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.country ? `, ${c.country}` : ""}
              </option>
            ))}
          </select>
        </label>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
          <div className="text-sm font-medium">Trip length</div>
          <div className={`mt-1 text-sm ${invalidLength ? "text-rose-700" : "text-zinc-600"}`}>
            {tripDays === null ? "Select dates" : `${tripDays} day(s)`}
            {invalidLength ? " (must be 1–14 days)" : ""}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Start date</span>
          <input
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">End date</span>
          <input
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </label>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">Meal slots (applied to every day)</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MEALS.map((m) => {
            const selected = mealTypes.includes(m.id);
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => toggleMeal(m.id)}
                className={`h-10 rounded-xl border px-3 text-sm font-medium ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-zinc-600">
          Neighborhood-per-day and slot locking come in Phase 4; this MVP focuses on must-try dishes.
        </p>
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
          onClick={() => (window.location.href = "/trips")}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={
            busy ||
            !cityId ||
            !startDate ||
            !endDate ||
            invalidLength ||
            mealTypes.length === 0
          }
          onClick={handleCreate}
        >
          Create trip
        </button>
      </div>
    </div>
  );
}
