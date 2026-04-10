import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteTripButton } from "@/components/trips/delete-trip-button";
import { getCityBanner, proxiedBannerImageUrl } from "@/lib/city-banners";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TripsPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth");

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

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Trips</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Create a trip, then browse must-try dishes for your destination.
            </p>
          </div>
          <Link
            href="/trips/new"
            className="inline-flex h-10 items-center rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
          >
            New trip
          </Link>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium">
            Your trips
          </div>
          <div className="divide-y divide-zinc-100">
            {(trips ?? []).length === 0 ? (
              <div className="px-4 py-8 text-sm text-zinc-600">
                No trips yet. Create one to get started.
              </div>
            ) : (
              (trips ?? []).map((trip) => {
                const slug = (trip as { cities?: { slug?: string } }).cities?.slug;
                const banner = getCityBanner(slug ?? null);
                const thumbSrc = banner
                  ? proxiedBannerImageUrl(banner.url) ?? banner.url
                  : null;
                return (
                  <div key={trip.id} className="flex items-center justify-between gap-4 p-4">
                  <div className="flex min-w-0 flex-1 items-center gap-4">
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
                        {(trip as { cities?: { name?: string } }).cities?.name ?? "Unknown city"}
                      </div>
                      <div className="text-sm text-zinc-600">
                        {trip.start_date} → {trip.end_date}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-4">
                    <Link
                      href={`/trips/${trip.id}`}
                      className="text-sm font-medium underline underline-offset-4"
                    >
                      Open
                    </Link>
                    <DeleteTripButton tripId={trip.id} variant="inline" />
                  </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

