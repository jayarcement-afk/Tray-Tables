"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { CanonicalDishCard } from "@/components/dishes/canonical-dish-card";
import type { CsvDish } from "@/lib/canonical-dishes";
import {
  type PriceFilterTier,
  filterCanonicalDishes,
} from "@/lib/filter-canonical-dishes";
import { fetchTripCustomDishesWithOptionalMigrate, isUserAddedDishId } from "@/lib/trip-custom-dishes";

type Props = {
  tripId: string;
  cityName: string;
  cityCountry: string;
  initialStartDate: string;
  initialEndDate: string;
  showTripDates?: boolean;
  dishes: CsvDish[];
  totalCount: number;
};

function daysBetweenInclusive(start: string, end: string): number | null {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return null;
  return Math.floor((e.getTime() - s.getTime()) / 86_400_000) + 1;
}

export function CanonicalDishesWithFilters({
  tripId,
  cityName,
  cityCountry,
  initialStartDate,
  initialEndDate,
  showTripDates = true,
  dishes,
  totalCount,
}: Props) {
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [priceTier, setPriceTier] = useState<PriceFilterTier>(3);
  const [selectedDishIds, setSelectedDishIds] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(initialEndDate);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [customDishes, setCustomDishes] = useState<CsvDish[]>([]);
  /** Avoid persisting initial `[]` before reload from storage (same bug as TripItineraryPlanner). */
  const skipNextSelectedPersist = useRef(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const customs = await fetchTripCustomDishesWithOptionalMigrate(
        tripId,
        cityName,
        cityCountry
      );
      if (!cancelled) setCustomDishes(customs);
    })();
    return () => {
      cancelled = true;
    };
  }, [tripId, cityName, cityCountry]);

  useEffect(() => {
    let cancelled = false;
    skipNextSelectedPersist.current = true;
    const storageKey = `trip-selected-dishes:${tripId}`;
    const itineraryKey = `trip-itinerary:${tripId}`;
    try {
      const selected = new Set<string>();
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          parsed.forEach((x) => {
            if (typeof x === "string") selected.add(x);
          });
        }
      }

      const itineraryRaw = window.localStorage.getItem(itineraryKey);
      if (itineraryRaw) {
        const parsed = JSON.parse(itineraryRaw) as {
          byDay?: Record<string, Record<string, string[]>>;
        };
        if (parsed?.byDay && typeof parsed.byDay === "object") {
          for (const day of Object.values(parsed.byDay)) {
            if (!day || typeof day !== "object") continue;
            for (const slotIds of Object.values(day)) {
              if (!Array.isArray(slotIds)) continue;
              slotIds.forEach((id) => {
                if (typeof id === "string") selected.add(id);
              });
            }
          }
        }
      }

      setSelectedDishIds([...selected]);
    } catch {
      // Ignore invalid localStorage payloads.
    }

    void (async () => {
      try {
        const res = await fetch(`/api/trips/${tripId}/reviews`);
        const json = (await res.json()) as {
          reviews?: Record<string, { rating?: number; experienceReview?: string; tags?: string[]; photos?: string[] }>;
        };
        const reviews = json.reviews;
        if (cancelled || !res.ok || !reviews || typeof reviews !== "object") return;
        setSelectedDishIds((prev) => {
          const s = new Set(prev);
          for (const id of Object.keys(reviews)) {
            if (id) s.add(id);
          }
          return [...s];
        });
      } catch {
        // ignore
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tripId]);

  useEffect(() => {
    if (skipNextSelectedPersist.current) {
      skipNextSelectedPersist.current = false;
      return;
    }
    const storageKey = `trip-selected-dishes:${tripId}`;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(selectedDishIds));
    } catch {
      // ignore
    }
  }, [tripId, selectedDishIds]);

  /** After selections load from storage/server, persist pins so passport stats see every “Add to Trip” from this page. */
  useEffect(() => {
    const t = window.setTimeout(async () => {
      try {
        const resGet = await fetch(`/api/trips/${tripId}/reviews`);
        const json = (await resGet.json()) as { reviews?: Record<string, unknown>; error?: string };
        if (!resGet.ok || !json.reviews || typeof json.reviews !== "object") return;
        const existing = json.reviews as Record<
          string,
          { rating: number; experienceReview: string; tags: string[]; photos: string[] }
        >;
        await fetch(`/api/trips/${tripId}/reviews`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reviews: existing, pinnedDishIds: selectedDishIds }),
        });
      } catch {
        // keep local state; retry on next change
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [tripId, selectedDishIds]);

  const filtered = useMemo(
    () => filterCanonicalDishes(dishes, vegetarianOnly, priceTier),
    [dishes, vegetarianOnly, priceTier]
  );

  const tripLength = useMemo(() => {
    if (!startDate || !endDate) return null;
    return daysBetweenInclusive(startDate, endDate);
  }, [startDate, endDate]);

  const invalidRange =
    tripLength !== null && (tripLength < 1 || tripLength > 20);

  async function toggleTripSelection(dishId: string) {
    if (selectedDishIds.includes(dishId)) {
      if (isUserAddedDishId(dishId)) {
        try {
          const res = await fetch(
            `/api/trips/${tripId}/custom-dishes/${encodeURIComponent(dishId)}`,
            { method: "DELETE" }
          );
          if (!res.ok) {
            const json = (await res.json().catch(() => ({}))) as { error?: string };
            window.alert(json.error ?? "Could not remove this dish from the server.");
            return;
          }
        } catch {
          window.alert("Could not remove this dish. Check your connection.");
          return;
        }
        setCustomDishes((cd) => cd.filter((d) => d.id !== dishId));
      }
      setSelectedDishIds((prev) => prev.filter((id) => id !== dishId));
      return;
    }
    setSelectedDishIds((prev) => [...prev, dishId]);
  }

  async function handleConfirmTrip() {
    if (!startDate || !endDate) {
      setConfirmError("Please choose both a start and end date.");
      return;
    }
    if (invalidRange) {
      setConfirmError("Trip length must be between 1 and 20 days.");
      return;
    }
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ startDate, endDate }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to confirm trip");
      window.location.href = "/trips";
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setConfirmBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Filters
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-6">
          <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-800">
            <input
              type="checkbox"
              className="size-4 rounded border-zinc-300"
              checked={vegetarianOnly}
              onChange={(e) => setVegetarianOnly(e.target.checked)}
            />
            <span className="font-medium">Vegetarian only</span>
          </label>
          <div>
            <div className="text-sm font-medium text-zinc-800">Price</div>
            <div
              className="mt-2 flex flex-wrap gap-2"
              role="group"
              aria-label="Filter by price symbols in the sheet"
            >
              {(
                [
                  { tier: 1 as const, label: "$" },
                  { tier: 2 as const, label: "$$" },
                  { tier: 3 as const, label: "$$$" },
                ] as const
              ).map(({ tier, label }) => (
                <button
                  key={tier}
                  type="button"
                  onClick={() => setPriceTier(tier)}
                  className={`h-10 min-w-[3.25rem] rounded-xl border px-3 text-sm font-medium ${
                    priceTier === tier
                      ? "border-zinc-900 bg-zinc-900 text-white"
                      : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                  }`}
                  aria-pressed={priceTier === tier}
                  title={
                    tier === 1
                      ? "Only dishes with one $ (or one £, €, ¥, etc.)"
                      : tier === 2
                        ? "Dishes with one or two price symbols"
                        : "All dishes (any price)"
                  }
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Showing {filtered.length} of {totalCount} dishes
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          Added to trip: {selectedDishIds.length}
        </p>
      </div>

      {customDishes.length > 0 ? (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-zinc-900">Your additions</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Dishes you added manually for this trip (not from the canonical
            must-try list for this city).
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {customDishes.map((d) => (
              <CanonicalDishCard
                key={d.id}
                dish={d}
                isAddedToTrip={selectedDishIds.includes(d.id)}
                onToggleAddToTrip={() => void toggleTripSelection(d.id)}
              />
            ))}
          </div>
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-5 py-12 text-center">
          <p className="text-sm text-zinc-700">
            No dishes match these filters. Try turning off filters or choosing
            $$$ to see every price level.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((d) => (
            <CanonicalDishCard
              key={d.id}
              dish={d}
              isAddedToTrip={selectedDishIds.includes(d.id)}
              onToggleAddToTrip={() => void toggleTripSelection(d.id)}
            />
          ))}
        </div>
      )}

      {showTripDates ? (
        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Trip dates</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Pick your dates here (up to 20 days), then confirm this trip.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
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
          <p className={`mt-2 text-xs ${invalidRange ? "text-rose-700" : "text-zinc-500"}`}>
            {tripLength === null ? "Pick both dates to calculate length." : `${tripLength} day(s)`}
            {invalidRange ? " (must be 1-20 days)" : ""}
          </p>
          {confirmError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {confirmError}
            </div>
          ) : null}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={handleConfirmTrip}
              disabled={
                confirmBusy || !startDate || !endDate || invalidRange
              }
              className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
            >
              Confirm Trip
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
