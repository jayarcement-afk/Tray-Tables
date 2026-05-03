"use client";

import { DishPhoto } from "@/components/dishes/dish-photo";
import type { CsvDish } from "@/lib/canonical-dishes";
import { resolveDishImageUrl } from "@/lib/dish-local-image";
import { dishPrimaryExternalHref } from "@/lib/trip-custom-dishes";
import { linkIsMichelinGuide } from "@/lib/michelin-source";

function hasVegetarianOptionsList(v: string): boolean {
  const t = v.trim().toLowerCase();
  return t === "yes" || t === "limited";
}

function isCsvYes(v: string): boolean {
  return v.trim().toLowerCase() === "yes";
}

export function CanonicalDishCard({
  dish,
  isAddedToTrip,
  onToggleAddToTrip,
}: {
  dish: CsvDish;
  isAddedToTrip: boolean;
  onToggleAddToTrip: () => void;
}) {
  const showVegTag = hasVegetarianOptionsList(dish.vegetarianOptions);
  const showLocalFavorite = isCsvYes(dish.localFavorite);
  const showTrendy = isCsvYes(dish.trendy);
  const showStreetFood = isCsvYes(dish.streetFood);
  const showMichelinGuide =
    dish.michelinGuide === true ||
    (!!dish.linkUrl?.trim() && linkIsMichelinGuide(dish.linkUrl));
  const showAttributeRow =
    showVegTag || showLocalFavorite || showTrendy || showStreetFood || showMichelinGuide;

  const imageSrc = resolveDishImageUrl(dish);

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      <DishPhoto src={imageSrc ?? ""} alt={dish.name} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold leading-tight text-zinc-900">
              {dish.name}
            </h3>
            {dish.restaurant ? (
              <p className="mt-0.5 text-sm text-zinc-600">{dish.restaurant}</p>
            ) : null}
            {dish.address?.trim() ? (
              <p className="mt-1 text-sm leading-snug text-zinc-500">{dish.address.trim()}</p>
            ) : null}
            <a
              href={dishPrimaryExternalHref(dish)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs font-medium text-zinc-700 underline underline-offset-2 hover:text-zinc-900"
            >
              Website/Map
            </a>
          </div>
          <button
            type="button"
            onClick={onToggleAddToTrip}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              isAddedToTrip
                ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-600"
                : "border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50"
            }`}
            aria-pressed={isAddedToTrip}
          >
            {isAddedToTrip ? "Added to Trip" : "Add to Trip"}
          </button>
        </div>
        {dish.why ? (
          <div className="mt-3">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Why
            </div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-700">
              {dish.why}
            </p>
          </div>
        ) : null}
        {showAttributeRow ? (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {showVegTag ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/90 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-800"
                title="Vegetarian options (from spreadsheet)"
              >
                <span className="select-none" aria-hidden>
                  🌿
                </span>
                <span className="sr-only">Has vegetarian options</span>
              </span>
            ) : null}
            {showLocalFavorite ? (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800">
                Local Favorite
              </span>
            ) : null}
            {showTrendy ? (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800">
                Trendy
              </span>
            ) : null}
            {showStreetFood ? (
              <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800">
                Street food
              </span>
            ) : null}
            {showMichelinGuide ? (
              <span
                className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-900"
                title="Michelin Guide"
              >
                Michelin Guide
              </span>
            ) : null}
          </div>
        ) : null}
        {dish.tags.length > 0 ? (
          <div className={showAttributeRow ? "mt-3" : "mt-4"}>
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Hours
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {dish.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        {dish.drinkPairing ? (
          <div className="mt-3">
            <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
              Drink pairing
            </div>
            <p className="mt-1 text-sm leading-relaxed text-zinc-700">
              {dish.drinkPairing}
            </p>
          </div>
        ) : null}
      </div>
    </article>
  );
}
