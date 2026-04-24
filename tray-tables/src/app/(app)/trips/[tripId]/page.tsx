import Link from "next/link";
import { redirect } from "next/navigation";

import { CityTripBanner } from "@/components/trips/city-trip-banner";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { TripItineraryPlanner } from "@/components/trips/trip-itinerary-planner";
import { getCanonicalDishesForSlug } from "@/lib/canonical-dishes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TripPage({
  params,
}: {
  params: Promise<{ tripId: string }>;
}) {
  const { tripId } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const { data: trip } = await supabase
    .from("trips")
    .select(
      `
      id,
      start_date,
      end_date,
      cities (
        id,
        name,
        country,
        slug
      )
    `
    )
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) redirect("/trips");

  const city = (trip as { cities?: { name?: string; country?: string; slug?: string } })
    .cities;
  const slug = city?.slug ?? null;
  const dishes = getCanonicalDishesForSlug(slug);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <CityTripBanner
        slug={city?.slug ?? null}
        cityName={city?.name ?? "Trip"}
        country={city?.country}
      />
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <Link
              href="/trips"
              className="text-sm font-medium text-zinc-700 underline underline-offset-4"
            >
              Back to trips
            </Link>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-900">
              {city?.name ?? "Your trip"}
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {trip.start_date} → {trip.end_date}
            </p>
          </div>
          <DeleteTripButton tripId={trip.id} />
        </div>

        <TripItineraryPlanner
          tripId={trip.id}
          cityName={city?.name ?? "Trip"}
          startDate={trip.start_date}
          endDate={trip.end_date}
          isPastTrip={trip.end_date < new Date().toISOString().slice(0, 10)}
          dishes={dishes}
        />
        {trip.end_date < new Date().toISOString().slice(0, 10) ? (
          <p className="mt-3 text-xs text-zinc-500">
            To persist reviews to your account, run{" "}
            <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-zinc-800">
              data/sql/create-trip-dish-reviews.sql
            </code>{" "}
            in Supabase SQL editor once.
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-1">
          <Link
            href={`/trips/${trip.id}/dishes?from=trip`}
            className="rounded-2xl border-2 border-zinc-900 bg-white p-6 shadow-md ring-1 ring-zinc-900/5 hover:bg-zinc-50"
          >
            <div className="text-sm font-medium text-zinc-600">Explore</div>
            <div className="mt-2 text-lg font-semibold">Canonical dishes</div>
            <p className="mt-1 text-sm text-zinc-600">
              View all dishes for this city and see which ones are already added
              to this trip.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

