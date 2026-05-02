"use client";

import { useState } from "react";

import { fileToOptimizedJpegBlob } from "@/lib/client-image-data-url";
import type { CsvDish } from "@/lib/canonical-dishes";
import {
  type MealSlotKey,
  type TripCustomDishApi,
  sanitizeHttpUrl,
  sortMealSlotsKeys,
  tripCustomDishesApiToCsv,
} from "@/lib/trip-custom-dishes";

type MealChoice = MealSlotKey;

const TAG_MEALS: Array<{ key: MealChoice; label: string }> = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "late_night", label: "Late night" },
];

type Props = {
  tripId: string;
  cityName: string;
  cityCountry: string;
  open: boolean;
  onClose: () => void;
  onSaved: (dish: CsvDish, mealSlots: MealChoice[]) => void;
};

export function AddTripDishModal({
  tripId,
  cityName,
  cityCountry,
  open,
  onClose,
  onSaved,
}: Props) {
  const [restaurant, setRestaurant] = useState("");
  const [dishName, setDishName] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [address, setAddress] = useState("");
  const [why, setWhy] = useState("");
  const [drinkPairing, setDrinkPairing] = useState("");
  const [mealSlots, setMealSlots] = useState<MealChoice[]>(["lunch"]);
  const [localFavorite, setLocalFavorite] = useState(false);
  const [trendy, setTrendy] = useState(false);
  const [streetFood, setStreetFood] = useState(false);
  const [vegetarian, setVegetarian] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function reset() {
    setRestaurant("");
    setDishName("");
    setLinkUrl("");
    setAddress("");
    setWhy("");
    setDrinkPairing("");
    setMealSlots(["lunch"]);
    setLocalFavorite(false);
    setTrendy(false);
    setStreetFood(false);
    setVegetarian(false);
    setImageFile(null);
    setError(null);
    setBusy(false);
  }

  function handleDismiss() {
    reset();
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const r = restaurant.trim();
    const d = dishName.trim();
    if (!r || !d) {
      setError("Restaurant and dish name are required.");
      return;
    }

    const linkTrimmed = linkUrl.trim();
    if (linkTrimmed && !sanitizeHttpUrl(linkTrimmed)) {
      setError("Enter a valid http(s) link, or leave the URL blank.");
      return;
    }

    const slotsOrdered = sortMealSlotsKeys(mealSlots);
    if (slotsOrdered.length === 0) {
      setError("Select at least one meal slot.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append(
        "payload",
        JSON.stringify({
          restaurant: r,
          dishName: d,
          linkUrl: linkTrimmed,
          address: address.trim().slice(0, 500),
          why,
          drinkPairing,
          mealSlots: slotsOrdered,
          localFavorite,
          trendy,
          streetFood,
          vegetarianOptions: vegetarian,
        })
      );

      if (imageFile) {
        try {
          const blob = await fileToOptimizedJpegBlob(imageFile);
          fd.append("image", blob, "dish.jpg");
        } catch {
          setError("Could not read that image. Try another file.");
          return;
        }
      }

      const res = await fetch(`/api/trips/${tripId}/custom-dishes`, {
        method: "POST",
        body: fd,
      });
      const json = (await res.json()) as { dish?: TripCustomDishApi; error?: string };
      if (!res.ok) {
        setError(json.error ?? "Could not save this dish.");
        return;
      }
      if (!json.dish) {
        setError("Unexpected response from server.");
        return;
      }

      const [dishCsv] = tripCustomDishesApiToCsv([json.dish], cityName, cityCountry);
      const savedSlots = sortMealSlotsKeys(
        json.dish.mealSlots?.length ? json.dish.mealSlots : slotsOrdered
      );
      reset();
      onSaved(dishCsv, savedSlots);
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/50 p-4"
      onClick={(ev) => {
        if (ev.target === ev.currentTarget && !busy) handleDismiss();
      }}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="text-lg font-semibold text-zinc-900">Add a dish / restaurant</h2>
          <p className="mt-1 text-xs text-zinc-600">
            This entry is saved for this trip and appears on your calendar like the other stops.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 px-5 py-4">
          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Restaurant name</span>
            <input
              required
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              value={restaurant}
              onChange={(e) => setRestaurant(e.target.value)}
              maxLength={200}
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Dish</span>
            <input
              required
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              value={dishName}
              onChange={(e) => setDishName(e.target.value)}
              maxLength={200}
              placeholder="Canonical / signature dish name"
              autoComplete="off"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Link URL</span>
            <input
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              maxLength={2000}
              placeholder="https://…"
              autoComplete="off"
            />
            <span className="mt-1 block text-xs text-zinc-500">Optional map, menu, or website.</span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Street address</span>
            <input
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              value={address}
              onChange={(e) => setAddress(e.target.value.slice(0, 500))}
              maxLength={500}
              placeholder="123 Main St, neighborhood (helps the trip map pin)"
              autoComplete="street-address"
            />
            <span className="mt-1 block text-xs text-zinc-500">Optional; used to place this stop on the map.</span>
          </label>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-800">Tags</legend>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-zinc-300"
                  checked={localFavorite}
                  onChange={(e) => setLocalFavorite(e.target.checked)}
                />
                Local favorite
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-zinc-300"
                  checked={trendy}
                  onChange={(e) => setTrendy(e.target.checked)}
                />
                Trendy
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-zinc-300"
                  checked={streetFood}
                  onChange={(e) => setStreetFood(e.target.checked)}
                />
                Street food
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  className="size-4 rounded border-zinc-300"
                  checked={vegetarian}
                  onChange={(e) => setVegetarian(e.target.checked)}
                />
                Vegetarian options
              </label>
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Why</span>
            <textarea
              className="mt-1 w-full rounded-xl border border-zinc-200 p-3 text-sm outline-none focus:border-zinc-400"
              rows={3}
              value={why}
              onChange={(e) => setWhy(e.target.value.slice(0, 100))}
              maxLength={100}
              placeholder="Up to 100 characters"
            />
            <span className="mt-1 block text-xs text-zinc-500">{why.length}/100</span>
          </label>

          <fieldset>
            <legend className="text-sm font-medium text-zinc-800">Hours / meal slots</legend>
            <p className="mt-1 text-xs text-zinc-500">Select all that apply (at least one).</p>
            <div className="mt-2 flex flex-wrap gap-3 text-sm">
              {TAG_MEALS.map((m) => (
                <label key={m.key} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-zinc-300"
                    checked={mealSlots.includes(m.key)}
                    onChange={() => {
                      setMealSlots((prev) => {
                        const set = new Set(prev);
                        if (set.has(m.key)) set.delete(m.key);
                        else set.add(m.key);
                        return sortMealSlotsKeys([...set]);
                      });
                    }}
                  />
                  {m.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Drink pairing</span>
            <input
              className="mt-1 h-11 w-full rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
              value={drinkPairing}
              onChange={(e) => setDrinkPairing(e.target.value.slice(0, 50))}
              maxLength={50}
              autoComplete="off"
            />
            <span className="mt-1 block text-xs text-zinc-500">{drinkPairing.length}/50</span>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-800">Dish image</span>
            <input
              type="file"
              accept="image/*"
              className="mt-1 block w-full text-sm text-zinc-700 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-800"
              onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
              disabled={busy}
            />
          </label>

          {error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50 disabled:opacity-50"
              disabled={busy}
              onClick={handleDismiss}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
              disabled={busy}
            >
              {busy ? "Saving…" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
