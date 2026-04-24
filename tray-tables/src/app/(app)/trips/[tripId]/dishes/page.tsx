import Link from "next/link";
import { redirect } from "next/navigation";

import { CanonicalDishesWithFilters } from "@/components/dishes/canonical-dishes-with-filters";
import { CityTripBanner } from "@/components/trips/city-trip-banner";
import { getCanonicalDishesForSlug } from "@/lib/canonical-dishes";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function TripDishesPage({
  params,
  searchParams,
}: {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { tripId } = await params;
  const { from } = await searchParams;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/auth");

  const { data: trip } = await supabase
    .from("trips")
    .select("id, city_id, start_date, end_date, cities ( name, country, slug )")
    .eq("id", tripId)
    .maybeSingle();

  if (!trip) redirect("/trips");

  const city = (trip as { cities?: { name?: string; country?: string; slug?: string } })
    .cities;
  const cityName = city?.name ?? "Destination";
  const slug = city?.slug ?? null;
  const startDate = (trip as { start_date?: string | null }).start_date ?? "";
  const endDate = (trip as { end_date?: string | null }).end_date ?? "";
  const dishes = getCanonicalDishesForSlug(slug);

  const emptyMessage =
    dishes.length === 0
      ? `No rows in the Canonical Dishes list for this city’s slug (“${slug ?? "unknown"}”). Regenerate with npm run data:canonical-dishes or add rows in the spreadsheet.`
      : "";

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <CityTripBanner
        slug={slug}
        cityName={cityName}
        country={city?.country}
      />
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <nav className="text-sm text-zinc-600" aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <li>
              <Link
                href="/trips"
                className="font-medium underline underline-offset-4 hover:text-zinc-900"
              >
                Trips
              </Link>
            </li>
            <li className="text-zinc-400" aria-hidden>
              /
            </li>
            <li>
              <Link
                href={`/trips/${tripId}`}
                className="font-medium underline underline-offset-4 hover:text-zinc-900"
              >
                {cityName}
              </Link>
            </li>
            <li className="text-zinc-400" aria-hidden>
              /
            </li>
            <li className="font-medium text-zinc-900">Dishes</li>
          </ol>
        </nav>

        <div className="mt-6">
          <Link
            href={`/trips/${tripId}`}
            className="text-sm font-medium text-zinc-700 underline underline-offset-4"
          >
            Back to trip overview
          </Link>
          <div className="mt-3">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Iconic dishes
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-zinc-600">
              Pulled from the Canonical Dishes spreadsheet: must-try dishes and
              where to have them, for {cityName}.
            </p>
            {dishes.length > 0 ? (
              <p className="mt-2 text-xs text-zinc-500">
                {dishes.length} in list · add an <code className="rounded bg-zinc-200/80 px-1">Image</code> or{" "}
                <code className="rounded bg-zinc-200/80 px-1">Image URL</code> column in the
                sheet and re-run{" "}
                <code className="rounded bg-zinc-200/80 px-1">npm run data:canonical-dishes</code>{" "}
                to show photos.
              </p>
            ) : null}
          </div>
        </div>

        <section className="mt-8" aria-label="Dishes from canonical list">
          {dishes.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50/80 px-5 py-12 text-center">
              <p className="text-sm leading-relaxed text-zinc-700">
                {emptyMessage}
              </p>
            </div>
          ) : (
            <CanonicalDishesWithFilters
              tripId={tripId}
              initialStartDate={startDate}
              initialEndDate={endDate}
              showTripDates={from !== "trip"}
              dishes={dishes}
              totalCount={dishes.length}
            />
          )}
        </section>
      </div>
    </div>
  );
}
