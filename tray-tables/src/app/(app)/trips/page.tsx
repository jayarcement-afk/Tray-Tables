import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { MarkCompleteButton } from "@/components/trips/mark-complete-button";
import { getCityBanner, proxiedBannerImageUrl } from "@/lib/city-banners";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type TripListRow = {
  id: string;
  start_date: string;
  end_date: string;
  cities?: { name?: string; country?: string; slug?: string } | null;
};

function TripRows({
  trips,
  allowComplete = false,
}: {
  trips: TripListRow[];
  allowComplete?: boolean;
}) {
  return (
    <>
      {trips.map((trip) => {
        const slug = trip.cities?.slug;
        const banner = getCityBanner(slug ?? null);
        const thumbSrc = banner
          ? (proxiedBannerImageUrl(banner.url) ?? banner.url)
          : null;
        const cityLabel = trip.cities?.name ?? "Unknown city";
        const dishesHref = `/trips/${trip.id}/dishes`;
        const overviewHref = `/trips/${trip.id}`;
        return (
          <div
            key={trip.id}
            className="relative flex flex-wrap items-center justify-between gap-4 p-4 sm:flex-nowrap"
          >
            <Link
              href={overviewHref}
              className="absolute inset-1 rounded-lg outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-zinc-400"
              aria-label={`Open trip map and calendar for ${cityLabel}`}
            />
            <div className="relative z-10 flex min-w-0 flex-1 items-center gap-4 pointer-events-none">
              {thumbSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbSrc}
                  alt=""
                  className="size-14 shrink-0 rounded-full object-cover ring-2 ring-zinc-200 shadow-sm"
                />
              ) : (
                <div
                  className="size-14 shrink-0 rounded-full bg-gradient-to-br from-slate-700 to-zinc-900 ring-2 ring-zinc-200 shadow-sm"
                  aria-hidden
                />
              )}
              <div className="min-w-0">
                <div className="font-medium">
                  {cityLabel}
                </div>
                <div className="text-sm text-zinc-600">
                  {trip.start_date} → {trip.end_date}
                </div>
              </div>
            </div>
            <div className="relative z-10 pointer-events-auto shrink-0 flex items-center gap-3 sm:gap-4">
              {allowComplete ? <MarkCompleteButton tripId={trip.id} /> : null}
              <DeleteTripButton tripId={trip.id} variant="inline" />
            </div>
          </div>
        );
      })}
    </>
  );
}

export default async function TripsPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    redirect("/auth?next=" + encodeURIComponent("/trips"));
  }

  const { data: trips } = await supabase
    .from("trips")
    .select(
      `
      id,
      start_date,
      end_date,
      cities (
        name,
        country,
        slug
      )
    `
    )
    .order("start_date", { ascending: false });

  const all: TripListRow[] = (trips as TripListRow[] | null) ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const activeTrips = all
    .filter((t) => t.end_date >= today)
    .sort((a, b) => a.start_date.localeCompare(b.start_date));
  const pastTrips = all
    .filter((t) => t.end_date < today)
    .sort((a, b) => b.end_date.localeCompare(a.end_date));

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Active trips</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Ongoing and upcoming food itineraries. Past trips are listed below.
            </p>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex h-10 shrink-0 items-center whitespace-nowrap rounded-xl bg-zinc-900 px-3 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New trip
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium">
            Your active trips
          </div>
          <div className="divide-y divide-zinc-100">
            {activeTrips.length === 0 ? (
              <div className="px-4 py-8 text-sm text-zinc-600">
                No active trips. Create a new one, or see past trips below.
              </div>
            ) : (
              <TripRows trips={activeTrips} allowComplete />
            )}
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
            Past trips
          </div>
          <div className="divide-y divide-zinc-100">
            {pastTrips.length === 0 ? (
              <div className="px-4 py-8 text-sm text-zinc-600">
                No past trips yet.
              </div>
            ) : (
              <TripRows trips={pastTrips} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
