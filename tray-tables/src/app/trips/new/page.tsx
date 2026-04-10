import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TripWizard } from "@/components/trips/trip-wizard";

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth");

  const { data: cities, error: citiesError } = await supabase
    .from("cities")
    .select("id,name,country,slug")
    .order("name", { ascending: true });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">New trip</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Choose a destination and dates (up to 14 days).
        </p>
        <div className="mt-6">
          <TripWizard
            initialCities={cities ?? []}
            queryError={citiesError?.message ?? null}
          />
        </div>
      </div>
    </div>
  );
}

