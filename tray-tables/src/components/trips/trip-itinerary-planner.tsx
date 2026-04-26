"use client";

import { useEffect, useMemo, useState } from "react";

import type { CsvDish } from "@/lib/canonical-dishes";
import { CanonicalDishCard } from "@/components/dishes/canonical-dish-card";
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
const MAX_IMAGE_EDGE_PX = 1600;
const JPEG_QUALITY = 0.78;

function isReviewByDishId(value: unknown): value is ReviewByDishId {
  return Boolean(value && typeof value === "object");
}

async function fileToOptimizedDataUrl(file: File): Promise<string> {
  const rawDataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });

  if (typeof document === "undefined") return rawDataUrl;

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = rawDataUrl;
  });

  const { naturalWidth, naturalHeight } = image;
  if (!naturalWidth || !naturalHeight) return rawDataUrl;

  const scale = Math.min(1, MAX_IMAGE_EDGE_PX / Math.max(naturalWidth, naturalHeight));
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return rawDataUrl;
  ctx.drawImage(image, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
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

function dishMapUrl(d: CsvDish) {
  const q = [d.restaurant, d.city, d.country].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
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
  startDate,
  endDate,
  isPastTrip,
  dishes,
}: Props) {
  const days = useMemo(() => dateRangeInclusive(startDate, endDate), [startDate, endDate]);
  const byId = useMemo(() => new Map(dishes.map((d) => [d.id, d])), [dishes]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [itinerary, setItinerary] = useState<Itinerary>({});
  const [reviews, setReviews] = useState<ReviewByDishId>({});
  const [reviewsLoaded, setReviewsLoaded] = useState(false);
  const [previewDishId, setPreviewDishId] = useState<string | null>(null);

  useEffect(() => {
    const ids = loadSelectedDishIds(tripId);
    setSelectedIds(ids);
  }, [tripId]);

  useEffect(() => {
    const selected = selectedIds.map((id) => byId.get(id)).filter((d): d is CsvDish => Boolean(d));
    const key = `trip-itinerary:${tripId}`;
    let base = defaultItinerary(days, selected);
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
    // Reconcile saved/base with currently selected dish ids.
    const selectedSet = new Set(selected.map((d) => d.id));
    for (const day of days) {
      if (!base[day]) base[day] = makeEmptyDayPlan();
      for (const s of MEAL_SLOTS) {
        base[day][s.key] = base[day][s.key].filter((id) => selectedSet.has(id));
      }
    }
    const placed = new Set<string>();
    for (const day of days) {
      for (const s of MEAL_SLOTS) {
        for (const id of base[day][s.key]) placed.add(id);
      }
    }
    const missing = selected.filter((d) => !placed.has(d.id));
    missing.forEach((dish, i) => {
      if (days.length === 0) return;
      const day = days[i % days.length];
      base[day][guessSlotFromDish(dish)].push(dish.id);
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

  function removeDishFromTrip(dishId: string) {
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

  function toggleTripSelection(dishId: string) {
    const dish = byId.get(dishId);
    if (!dish) return;

    const isSelected = selectedIds.includes(dishId);
    if (isSelected) {
      removeDishFromTrip(dishId);
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
      mappedDishes.map((d) => ({
        key: `${d.restaurant}|${d.city}|${d.country}`,
        label: `${d.restaurant} — ${d.name}`,
        query: [d.restaurant, d.city, d.country].filter(Boolean).join(", "),
        mapUrl: dishMapUrl(d),
      })),
    [mappedDishes]
  );

  return (
    <section className="mt-8">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Map</h2>
        <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200">
          <TripRestaurantsMap cityName={cityName} points={mapPoints} />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Calendar</h2>
        <p className="mt-1 text-xs text-zinc-500">
          Drag and drop dishes between meal slots.
        </p>
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
                              <div className="text-zinc-500">Hours: {d.hours || "N/A"}</div>
                              <div className="mt-1 flex items-center justify-between gap-2">
                                <a
                                  href={dishMapUrl(d)}
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
                                    removeDishFromTrip(dishId);
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

      {previewDish ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
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
              onToggleAddToTrip={() => toggleTripSelection(previewDish.id)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
