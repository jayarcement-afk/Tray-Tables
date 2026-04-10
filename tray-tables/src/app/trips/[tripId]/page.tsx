import Link from "next/link";
import { redirect } from "next/navigation";

import { CityTripBanner } from "@/components/trips/city-trip-banner";
import { DeleteTripButton } from "@/components/trips/delete-trip-button";
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
            <p className="mt-2 text-sm text-zinc-600">
              {trip.start_date} → {trip.end_date}
            </p>
          </div>
          <DeleteTripButton tripId={trip.id} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={`/trips/${trip.id}/dishes`}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
          >
            <div className="text-sm font-medium text-zinc-600">Explore</div>
            <div className="mt-2 text-lg font-semibold">Must‑try dishes</div>
            <p className="mt-1 text-sm text-zinc-600">
              Canonical dishes for this destination (seeded for MVP).
            </p>
          </Link>

          <Link
            href="/onboarding"
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm hover:bg-zinc-50"
          >
            <div className="text-sm font-medium text-zinc-600">Profile</div>
            <div className="mt-2 text-lg font-semibold">Food preferences</div>
            <p className="mt-1 text-sm text-zinc-600">
              Eater types, dietary constraints, price, spice, first-time vs repeat.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}

