import Link from "next/link";
import { redirect } from "next/navigation";

import { DishPhoto } from "@/components/dishes/dish-photo";
import { CityTripBanner } from "@/components/trips/city-trip-banner";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TripDishesPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_time_visitor")
    .eq("user_id", userData.user.id)
    .maybeSingle();

  const firstTime = profile?.first_time_visitor ?? true;

  const { data: trip } = await supabase
    .from("trips")
    .select("id, city_id, cities ( name, country, slug )")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) redirect("/trips");

  const { data: dishes } = await supabase
    .from("dishes")
    .select(
      "id,name,what_it_is,ingredients,short_history,is_must_eat,is_hidden_gem,photo_url,photo_source,human_validated"
    )
    .eq("city_id", trip.city_id)
    .order("name", { ascending: true });

  const mustEat = (dishes ?? []).filter((d) => d.is_must_eat);
  const hidden = (dishes ?? []).filter((d) => d.is_hidden_gem);

  const primary = firstTime ? mustEat : hidden;
  const secondary = firstTime ? hidden : mustEat;

  const city = (trip as { cities?: { name?: string; country?: string; slug?: string } })
    .cities;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <CityTripBanner
        slug={city?.slug ?? null}
        cityName={city?.name ?? "Destination"}
        country={city?.country}
      />
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6">
          <Link
            href={`/trips/${tripId}`}
            className="text-sm font-medium text-zinc-700 underline underline-offset-4"
          >
            Back to trip
          </Link>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">
            {firstTime ? "Must‑eat dishes" : "Hidden gems"}
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {firstTime
              ? "Canonical dishes most travelers shouldn’t miss."
              : "Off-the-beaten-path regional dishes for repeat visits."}
          </p>
        </div>

        <DishGrid dishes={primary} emptyText="No dishes yet for this city." />

        {secondary.length ? (
          <div className="mt-10">
            <h2 className="text-lg font-semibold">
              {firstTime ? "Also worth exploring" : "Canonical must‑eats"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              {firstTime
                ? "Hidden gems to bookmark if you have time."
                : "The classic baseline dishes for the destination."}
            </p>
            <div className="mt-4">
              <DishGrid dishes={secondary} emptyText="" />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DishGrid({
  dishes,
  emptyText,
}: {
  dishes: Array<{
    id: string;
    name: string;
    what_it_is: string;
    ingredients: string[];
    short_history: string | null;
    photo_url: string | null;
    photo_source: string | null;
    human_validated: boolean;
  }>;
  emptyText: string;
}) {
  if (!dishes.length) {
    return emptyText ? (
      <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-10 text-sm text-zinc-600">
        {emptyText}
      </div>
    ) : null;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {dishes.map((d) => (
        <div
          key={d.id}
          className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
        >
          {d.photo_url ? (
            <DishPhoto src={d.photo_url} alt={d.name} />
          ) : (
            <div className="aspect-[4/3] w-full bg-zinc-100" />
          )}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">{d.name}</div>
                <div className="mt-1 text-sm text-zinc-600">{d.what_it_is}</div>
              </div>
              <div
                className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                  d.human_validated
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {d.human_validated ? "Verified" : "Draft"}
              </div>
            </div>

            {d.ingredients?.length ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {d.ingredients.slice(0, 8).map((i) => (
                  <span
                    key={i}
                    className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-700"
                  >
                    {i}
                  </span>
                ))}
              </div>
            ) : null}

            {d.short_history ? (
              <div className="mt-4">
                <div className="text-xs font-medium text-zinc-600">History</div>
                <div className="mt-1 text-sm leading-relaxed text-zinc-700">
                  {d.short_history}
                </div>
              </div>
            ) : null}

            {d.photo_source ? (
              <div className="mt-4 text-xs text-zinc-500">
                Photo: {d.photo_source}
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}

