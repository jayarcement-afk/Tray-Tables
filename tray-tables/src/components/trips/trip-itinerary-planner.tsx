"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { CsvDish } from "@/lib/canonical-dishes";
import { fileToOptimizedDataUrl } from "@/lib/client-image-data-url";
import {
  coordsFromMapsLinkUrl,
  dishPrimaryExternalHref,
  fetchTripCustomDishesWithOptionalMigrate,
  isUserAddedDishId,
  mapExtraGeocodeQueriesForDish,
  mapGeocodeQueryForDish,
  mapPointKeyForDish,
} from "@/lib/trip-custom-dishes";
import { CanonicalDishCard } from "@/components/dishes/canonical-dish-card";
import { AddTripDishModal } from "@/components/trips/add-trip-dish-modal";
import { TripRestaurantsMap } from "@/components/trips/trip-restaurants-map";

type MealSlot = "breakfast" | "lunch" | "dinner" | "late_night";
const MEAL_SLOTS: Array<{ key: MealSlot; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "late_night", label: "Late Night" },
];

type DayPlan = Record<MealSlot, string[]>;
type Itinerary = Record<string, DayPlan>;

type Props = {
  tripId: string;
  cityName: string;
  cityCountry: string;
  startDate: string;
  endDate: string;
  isPastTrip: boolean;
  dishes: CsvDish[];
};

const REVIEW_TAGS = [
  "Great Service",
  "Must Try",
  "Vibes",
  "Authentic",
  "Fresh",
  "Creative",
  "Atmosphere",
  "Value",
  "Tourist-friendly",
  "Views",
] as const;

type DishReview = {
  rating: number;
  experienceReview: string;
  tags: string[];
  photos: string[];
};

type ReviewByDishId = Record<string, DishReview>;
const MAX_PHOTOS_PER_DISH = 8;
const MAX_UPLOAD_FILES_PER_PICK = 4;

function isReviewByDishId(value: unknown): value is ReviewByDishId {
  return Boolean(value && typeof value === "object");
}

function dateRangeInclusive(start: string, end: string): string[] {
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()) || e < s) return [];
  const out: string[] = [];
  const cur = new Date(s);
  while (cur <= e) {
    out.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

function makeEmptyDayPlan(): DayPlan {
  return { breakfast: [], lunch: [], dinner: [], late_night: [] };
}

function guessSlotFromDish(d: CsvDish): MealSlot {
  const t = d.tags.map((x) => x.trim().toLowerCase());
  if (t.includes("breakfast")) return "breakfast";
  if (t.includes("lunch")) return "lunch";
  if (t.includes("dinner")) return "dinner";
  if (t.includes("late night")) return "late_night";
  if (t.includes("all day")) return "lunch";
  return "lunch";
}

function loadSelectedDishIds(tripId: string): string[] {
  try {
    const out = new Set<string>();
    const raw = window.localStorage.getItem(`trip-selected-dishes:${tripId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        parsed.forEach((x) => {
          if (typeof x === "string") out.add(x);
        });
      }
    }

    const itineraryRaw = window.localStorage.getItem(`trip-itinerary:${tripId}`);
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
              if (typeof id === "string") out.add(id);
            });
          }
        }
      }
    }

    return [...out];
  } catch {
    return [];
  }
}

function defaultItinerary(days: string[], selected: CsvDish[]): Itinerary {
  const plan: Itinerary = {};
  for (const d of days) plan[d] = makeEmptyDayPlan();
  if (days.length === 0) return plan;
  selected.forEach((dish, i) => {
    const day = days[i % days.length];
    plan[day][guessSlotFromDish(dish)].push(dish.id);
  });
  return plan;
}

export function TripItineraryPlanner({
  tripId,
  cityName,
  cityCountry,
  startDate,
  endDate,
  isPastTrip,
  dishes,
}: Props) {
  const days = useMemo(() => dateRangeInclusive(startDate, endDate), [startDate, endDate]);
  const [customDishes, setCustomDishes] = useState<CsvDish[]>([]);
  const allDishes = useMemo(() => [...dishes, ...customDishes], [dishes, customDishes]);
  const byId = useMemo(() => new Map(allDishes.map((d) => [d.id, d])), [allDishes]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary>({});
  const [reviews, setReviews] = useState<ReviewByDishId>({});
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [previewDishId, setPreviewDishId] = useState<string | null>(null);
  const [addDishOpen, setAddDishOpen] = useState(false);
  /** Avoid writing `[]` before selections are reloaded from localStorage (wipes saved dishes). */
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

  const orphanUserDishKey = useMemo(
    () =>
      selectedIds
        .filter((id) => isUserAddedDishId(id) && !byId.has(id))
        .sort()
        .join("|"),
    [selectedIds, byId]
  );

  /** If selections reference custom dishes that are not in memory yet, reload once (auth / first fetch race). */
  useEffect(() => {
    if (!orphanUserDishKey) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        const customs = await fetchTripCustomDishesWithOptionalMigrate(
          tripId,
          cityName,
          cityCountry
        );
        if (!cancelled) setCustomDishes(customs);
      })();
    }, 700);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orphanUserDishKey, tripId, cityName, cityCountry]);

  useEffect(() => {
    skipNextSelectedPersist.current = true;
    const ids = loadSelectedDishIds(tripId);
    setSelectedIds(ids);
  }, [tripId]);

  useEffect(() => {
    if (skipNextSelectedPersist.current) {
      skipNextSelectedPersist.current = false;
      return;
    }
    try {
      window.localStorage.setItem(`trip-selected-dishes:${tripId}`, JSON.stringify(selectedIds));
    } catch {
      // ignore
    }
  }, [tripId, selectedIds]);

  useEffect(() => {
    const resolved = selectedIds.map((id) => byId.get(id)).filter((d): d is CsvDish => Boolean(d));
    const selectedIdSet = new Set(selectedIds);
    const key = `trip-itinerary:${tripId}`;
    let base = defaultItinerary(days, resolved);
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw) as { byDay?: Itinerary; startDate?: string; endDate?: string };
        if (saved.byDay && saved.startDate === startDate && saved.endDate === endDate) {
          base = saved.byDay;
        }
      }
    } catch {
      // noop
    }
    // Reconcile saved/base with selected ids (resolved later when custom dishes hydrate).
    for (const day of days) {
      if (!base[day]) base[day] = makeEmptyDayPlan();
      for (const s of MEAL_SLOTS) {
        base[day][s.key] = base[day][s.key].filter((id) => selectedIdSet.has(id));
      }
    }
    const placed = new Set<string>();
    for (const day of days) {
      for (const s of MEAL_SLOTS) {
        for (const id of base[day][s.key]) placed.add(id);
      }
    }
    const missingIds = selectedIds.filter((id) => !placed.has(id));
    missingIds.forEach((id, i) => {
      const dish = byId.get(id);
      if (!dish || days.length === 0) return;
      const day = days[i % days.length];
      base[day][guessSlotFromDish(dish)].push(id);
    });
    setItinerary(base);
  }, [tripId, days, selectedIds, byId, startDate, endDate]);

  useEffect(() => {
    if (days.length === 0) return;
    const key = `trip-itinerary:${tripId}`;
    window.localStorage.setItem(
      key,
      JSON.stringify({ startDate, endDate, byDay: itinerary })
    );
  }, [tripId, startDate, endDate, itinerary, days.length]);

  useEffect(() => {
    let cancelled = false;
    async function loadReviews() {
      try {
        const res = await fetch(`/api/trips/${tripId}/reviews`);
        const json = (await res.json()) as { reviews?: ReviewByDishId; error?: string };
        if (!cancelled && res.ok && json.reviews && isReviewByDishId(json.reviews)) {
          setReviews(json.reviews);
          setReviewsLoaded(true);
          return;
        }
      } catch {
        // Fallback below
      }

      const key = `trip-reviews:${tripId}`;
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) {
          if (!cancelled) {
            setReviews({});
            setReviewsLoaded(true);
          }
          return;
        }
        const parsed = JSON.parse(raw) as unknown;
        if (!cancelled) {
          setReviews(isReviewByDishId(parsed) ? parsed : {});
          setReviewsLoaded(true);
        }
      } catch {
        if (!cancelled) {
          setReviews({});
          setReviewsLoaded(true);
        }
      }
    }
    void loadReviews();
    return () => {
      cancelled = true;
    };
  }, [tripId]);

  useEffect(() => {
    const key = `trip-reviews:${tripId}`;
    window.localStorage.setItem(key, JSON.stringify(reviews));
  }, [tripId, reviews]);

  useEffect(() => {
    if (!isPastTrip || !reviewsLoaded) return;
    const t = setTimeout(async () => {
      try {
        await fetch(`/api/trips/${tripId}/reviews`, {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ reviews }),
        });
      } catch {
        // Keep local backup; retry on next change.
      }
    }, 600);
    return () => clearTimeout(t);
  }, [tripId, reviews, isPastTrip, reviewsLoaded]);

  function onDragStart(e: React.DragEvent, dishId: string, day: string, slot: MealSlot) {
    e.dataTransfer.setData("text/plain", JSON.stringify({ dishId, fromDay: day, fromSlot: slot }));
    e.dataTransfer.effectAllowed = "move";
  }

  function onDrop(e: React.DragEvent, day: string, slot: MealSlot) {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData("text/plain");
      const parsed = JSON.parse(raw) as { dishId: string; fromDay: string; fromSlot: MealSlot };
      setItinerary((prev) => {
        const next: Itinerary = structuredClone(prev);
        next[parsed.fromDay][parsed.fromSlot] = next[parsed.fromDay][parsed.fromSlot].filter((id) => id !== parsed.dishId);
        next[day][slot].push(parsed.dishId);
        return next;
      });
    } catch {
      // ignore invalid drop payload
    }
  }

  function getReview(dishId: string): DishReview {
    return (
      reviews[dishId] ?? {
        rating: 0,
        experienceReview: "",
        tags: [],
        photos: [],
      }
    );
  }

  function updateReview(dishId: string, patch: Partial<DishReview>) {
    setReviews((prev) => {
      const cur = getReview(dishId);
      return {
        ...prev,
        [dishId]: {
          ...cur,
          ...patch,
        },
      };
    });
  }

  async function addPhotos(dishId: string, files: FileList | null) {
    if (!files || files.length === 0) return;

    const picked = Array.from(files).slice(0, MAX_UPLOAD_FILES_PER_PICK);
    const dataUrls: string[] = [];
    for (const file of picked) {
      try {
        dataUrls.push(await fileToOptimizedDataUrl(file));
      } catch {
        // Skip unreadable files; keep the rest.
      }
    }

    const cur = getReview(dishId);
    updateReview(dishId, {
      photos: [...cur.photos, ...dataUrls].slice(0, MAX_PHOTOS_PER_DISH),
    });
  }

  async function removeDishFromTrip(dishId: string) {
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
      setCustomDishes((prev) => prev.filter((d) => d.id !== dishId));
    }
    setSelectedIds((prev) => prev.filter((id) => id !== dishId));
    setItinerary((prev) => {
      const next: Itinerary = structuredClone(prev);
      for (const day of Object.keys(next)) {
        for (const s of MEAL_SLOTS) {
          next[day][s.key] = next[day][s.key].filter((id) => id !== dishId);
        }
      }
      return next;
    });
  }

  async function toggleTripSelection(dishId: string) {
    const dish = byId.get(dishId);
    if (!dish) return;

    const isSelected = selectedIds.includes(dishId);
    if (isSelected) {
      await removeDishFromTrip(dishId);
      return;
    }

    setSelectedIds((prev) => [...prev, dishId]);
    setItinerary((prev) => {
      const next: Itinerary = structuredClone(prev);
      if (days.length === 0) return next;
      const day = days[0];
      if (!next[day]) next[day] = makeEmptyDayPlan();
      next[day][guessSlotFromDish(dish)].push(dishId);
      return next;
    });
  }

  const selectedDishes = selectedIds
    .map((id) => byId.get(id))
    .filter((d): d is CsvDish => Boolean(d));
  const previewDish = previewDishId ? byId.get(previewDishId) ?? null : null;

  const mappedDishes = useMemo(() => {
    const ids = new Set<string>(selectedIds);
    for (const day of Object.keys(itinerary)) {
      for (const s of MEAL_SLOTS) {
        for (const dishId of itinerary[day]?.[s.key] ?? []) ids.add(dishId);
      }
    }
    return [...ids]
      .map((id) => byId.get(id))
      .filter((d): d is CsvDish => Boolean(d));
  }, [selectedIds, itinerary, byId]);

  const mapPoints = useMemo(
    () =>
      mappedDishes.map((d) => {
        const fromLink = coordsFromMapsLinkUrl(d.linkUrl);
        const addr = d.address?.trim() ?? "";
        const extras = mapExtraGeocodeQueriesForDish(d, cityName, cityCountry);
        return {
          key: mapPointKeyForDish(d),
          label: `${d.restaurant} — ${d.name}`,
          query: mapGeocodeQueryForDish(d),
          mapUrl: dishPrimaryExternalHref(d),
          address: addr.length > 0 ? addr : null,
          ...(extras.length > 0 ? { extraGeocodeQueries: extras } : {}),
          ...(fromLink ? { lat: fromLink.lat, lon: fromLink.lon } : {}),
        };
      }),
    [mappedDishes, cityName, cityCountry]
  );

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Map</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
          <TripRestaurantsMap
            cityName={cityName}
            cityCountry={cityCountry}
            points={mapPoints}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Calendar</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Drag and drop dishes between meal slots.
            </p>
          </div>
          {!isPastTrip ? (
            <button
              type="button"
              className="h-11 shrink-0 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
              onClick={() => setAddDishOpen(true)}
            >
              Add a Dish/Restaurant
            </button>
          ) : null}
        </div>
        {days.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-700">Trip dates are not set yet.</p>
        ) : selectedDishes.length === 0 ? (
          <p className="mt-4 text-sm text-zinc-700">No dishes were added to this trip yet.</p>
        ) : (
          <div className="mt-4 space-y-4">
            {days.map((day) => (
              <div key={day} className="rounded-xl border border-zinc-200 p-3">
                <div className="mb-3 text-sm font-semibold text-zinc-900">{day}</div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {MEAL_SLOTS.map((s) => (
                    <div
                      key={`${day}-${s.key}`}
                      className="rounded-lg border border-zinc-200 bg-zinc-50 p-2"
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => onDrop(e, day, s.key)}
                    >
                      <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                        {s.label}
                      </div>
                      <div className="space-y-2 min-h-10">
                        {(itinerary[day]?.[s.key] ?? []).map((dishId) => {
                          const d = byId.get(dishId);
                          if (!d) return null;
                          return (
                            <div
                              key={`${day}-${s.key}-${dishId}-${d.restaurant}`}
                              className="cursor-move rounded-md border border-zinc-200 bg-white p-2 text-xs"
                              draggable
                              onDragStart={(e) => onDragStart(e, dishId, day, s.key)}
                            >
                              <button
                                type="button"
                                className="font-semibold text-zinc-900 underline underline-offset-2 hover:text-zinc-700"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewDishId(dishId);
                                }}
                              >
                                {d.name}
                              </button>
                              <div className="text-zinc-600">{d.restaurant}</div>
                              {d.address?.trim() ? (
                                <div className="text-zinc-500">{d.address.trim()}</div>
                              ) : null}
                              <div className="text-zinc-500">Hours: {d.hours || "N/A"}</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <a
                                  href={dishPrimaryExternalHref(d)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-zinc-700 underline underline-offset-2"
                                >
                                  Link
                                </a>
                                <button
                                  type="button"
                                  className="rounded border border-rose-200 bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 hover:bg-rose-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void removeDishFromTrip(dishId);
                                  }}
                                >
                                  Remove
                                </button>
                              </div>
                              {isPastTrip ? (
                                <div className="mt-2 rounded-md border border-zinc-200 bg-zinc-50 p-2">
                                  <div className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                    Review
                                  </div>
                                  <div className="mt-1 flex items-center gap-1">
                                    {Array.from({ length: 5 }).map((_, i) => {
                                      const rating = i + 1;
                                      const active = getReview(dishId).rating >= rating;
                                      return (
                                        <button
                                          key={rating}
                                          type="button"
                                          onClick={() => updateReview(dishId, { rating })}
                                          className={`text-sm ${
                                            active ? "text-amber-500" : "text-zinc-300"
                                          }`}
                                          aria-label={`Rate ${rating} star${rating > 1 ? "s" : ""}`}
                                        >
                                          ★
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <label className="mt-2 block">
                                    <span className="text-[11px] font-medium text-zinc-600">
                                      Experince Review
                                    </span>
                                    <textarea
                                      className="mt-1 w-full rounded border border-zinc-200 p-1.5 text-xs outline-none focus:border-zinc-400"
                                      rows={3}
                                      value={getReview(dishId).experienceReview}
                                      onChange={(e) =>
                                        updateReview(dishId, {
                                          experienceReview: e.target.value,
                                        })
                                      }
                                    />
                                  </label>
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {REVIEW_TAGS.map((tag) => {
                                      const selected = getReview(dishId).tags.includes(tag);
                                      return (
                                        <button
                                          key={tag}
                                          type="button"
                                          onClick={() => {
                                            const cur = getReview(dishId);
                                            updateReview(dishId, {
                                              tags: selected
                                                ? cur.tags.filter((t) => t !== tag)
                                                : [...cur.tags, tag],
                                            });
                                          }}
                                          className={`rounded-full border px-2 py-0.5 text-[11px] ${
                                            selected
                                              ? "border-zinc-900 bg-zinc-900 text-white"
                                              : "border-zinc-200 bg-white text-zinc-700"
                                          }`}
                                        >
                                          {tag}
                                        </button>
                                      );
                                    })}
                                  </div>
                                  <label className="mt-2 inline-flex cursor-pointer items-center gap-2 rounded border border-zinc-200 bg-white px-2 py-1 text-[11px] font-medium text-zinc-700">
                                    Upload photos
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      className="hidden"
                                      onChange={(e) => void addPhotos(dishId, e.target.files)}
                                    />
                                  </label>
                                  {getReview(dishId).photos.length > 0 ? (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      {getReview(dishId).photos.map((src, idx) => (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                          key={`${dishId}-photo-${idx}`}
                                          src={src}
                                          alt=""
                                          className="h-10 w-10 rounded object-cover"
                                        />
                                      ))}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AddTripDishModal
        tripId={tripId}
        cityName={cityName}
        cityCountry={cityCountry}
        open={addDishOpen}
        onClose={() => setAddDishOpen(false)}
        onSaved={(dish, mealSlots) => {
          setCustomDishes((prev) => [...prev, dish]);
          setSelectedIds((prev) => (prev.includes(dish.id) ? prev : [...prev, dish.id]));
          setItinerary((prev) => {
            if (days.length === 0) return prev;
            const next: Itinerary = structuredClone(prev);
            const day = days[0];
            if (!next[day]) next[day] = makeEmptyDayPlan();
            for (const slot of mealSlots) {
              if (!next[day][slot].includes(dish.id)) next[day][slot].push(dish.id);
            }
            return next;
          });
        }}
      />

      {previewDish ? (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPreviewDishId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-auto rounded-2xl bg-white p-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex justify-end">
              <button
                type="button"
                className="rounded border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                onClick={() => setPreviewDishId(null)}
              >
                Close
              </button>
            </div>
            <CanonicalDishCard
              dish={previewDish}
              isAddedToTrip={selectedIds.includes(previewDish.id)}
              onToggleAddToTrip={() => void toggleTripSelection(previewDish.id)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
