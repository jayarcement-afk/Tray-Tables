import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { NewTripForm } from "@/components/trips/new-trip-form";

export const dynamic = "force-dynamic";

export default async function NewTripPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/auth?next=" + encodeURIComponent("/trips/new"));
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">New trip</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Pick a city, and we&apos;ll guide you to its iconic dishes—along with
          the best restaurants to experience them.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          First time: run{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-zinc-800">
            data/sql/seed-canonical-cities.sql
          </code>{" "}
          in Supabase so all cities exist. If your DB still has the old 14-day
          limit, also run{" "}
          <code className="rounded bg-zinc-200/80 px-1.5 py-0.5 text-zinc-800">
            data/sql/update-trip-max-20-days.sql
          </code>
          .
        </p>
        <div className="mt-6">
          <NewTripForm />
        </div>
      </div>
    </div>
  );
}

