import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type MealType = "breakfast" | "lunch" | "dinner" | "late_night" | "street_food" | "snack";

type CreateTripBody = {
  /** Set when the client has a direct city id (legacy) */
  cityId?: string;
  /** City slug (matches public.cities.slug) from Canonical Dishes list / seed */
  citySlug?: string;
  /** YYYY-MM-DD */
  startDate?: string;
  endDate?: string;
  /** Applied to each trip day. Defaults to breakfast, lunch, dinner when omitted. */
  mealTypes?: MealType[];
  neighborhoodsByDate?: Record<string, string[]>; // YYYY-MM-DD -> names
};

const LEGACY_CITY_SLUG_ALIASES: Record<string, string> = {
  // Older canonical seed used `barcelona-spain`, but dishes/trips are keyed on `barcelona`.
  "barcelona-spain": "barcelona",
};

function dateRangeInclusive(start: Date, end: Date) {
  const out: string[] = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    out.push(cursor.toISOString().slice(0, 10));
    cursor.setDate(cursor.getDate() + 1);
  }
  return out;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as CreateTripBody;

  if (!body.cityId && !body.citySlug) {
    return NextResponse.json(
      { error: "Missing city (id or slug)" },
      { status: 400 }
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const startStr = body.startDate ?? body.endDate ?? today;
  const endStr = body.endDate ?? body.startDate ?? startStr;
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json(
      { error: "End date must be on or after start date" },
      { status: 400 }
    );
  }
  const dayCount =
    Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (dayCount < 1 || dayCount > 20) {
    return NextResponse.json({ error: "Trip must be 1-20 days" }, { status: 400 });
  }

  const mealTypes: MealType[] =
    body.mealTypes && body.mealTypes.length > 0
      ? body.mealTypes
      : ["breakfast", "lunch", "dinner"];

  // trips.user_id references public.profiles — ensure row exists (signup may not have run DB trigger yet).
  const { error: profileError } = await supabase.from("profiles").upsert(
    { user_id: userData.user.id },
    { onConflict: "user_id" }
  );
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let resolvedCityId: string | null = null;
  if (body.cityId) {
    resolvedCityId = body.cityId;
  } else if (body.citySlug) {
    const normalizedSlug =
      LEGACY_CITY_SLUG_ALIASES[body.citySlug] ?? body.citySlug;
    const { data: bySlug, error: cityErr } = await supabase
      .from("cities")
      .select("id")
      .eq("slug", normalizedSlug)
      .maybeSingle();
    if (cityErr) {
      return NextResponse.json({ error: cityErr.message }, { status: 500 });
    }
    if (!bySlug) {
      return NextResponse.json(
        {
          error:
            "That city is not in the database yet. Run the SQL in tray-tables/data/sql/seed-canonical-cities.sql in the Supabase SQL editor, or pick a city from an updated database.",
        },
        { status: 400 }
      );
    }
    resolvedCityId = bySlug.id;
  }
  if (!resolvedCityId) {
    return NextResponse.json(
      { error: "Could not resolve city" },
      { status: 400 }
    );
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: userData.user.id,
      city_id: resolvedCityId,
      start_date: startStr,
      end_date: endStr,
    })
    .select("id")
    .single();

  if (tripError || !trip) {
    return NextResponse.json({ error: tripError?.message ?? "Failed to create trip" }, { status: 500 });
  }

  const dates = dateRangeInclusive(start, end);

  const { data: tripDays, error: daysError } = await supabase
    .from("trip_days")
    .insert(dates.map((d) => ({ trip_id: trip.id, trip_date: d })))
    .select("id,trip_date");

  if (daysError || !tripDays) {
    return NextResponse.json({ error: daysError?.message ?? "Failed to create trip days" }, { status: 500 });
  }

  const dayIdByDate = new Map(tripDays.map((d) => [d.trip_date, d.id]));

  const mealRows = tripDays.flatMap((d) => mealTypes.map((mt) => ({ trip_day_id: d.id, meal_type: mt })));
  const { error: mealsError } = await supabase.from("meal_slots").insert(mealRows);
  if (mealsError) {
    return NextResponse.json({ error: mealsError.message ?? "Failed to create meal slots" }, { status: 500 });
  }

  const neighborhoodsByDate = body.neighborhoodsByDate ?? {};
  const neighborhoodRows: { trip_day_id: string; name: string }[] = [];
  for (const [date, names] of Object.entries(neighborhoodsByDate)) {
    const dayId = dayIdByDate.get(date);
    if (!dayId) continue;
    for (const name of names) {
      const trimmed = name.trim();
      if (!trimmed) continue;
      neighborhoodRows.push({ trip_day_id: dayId, name: trimmed });
    }
  }
  if (neighborhoodRows.length) {
    const { error: nError } = await supabase.from("trip_day_neighborhoods").insert(neighborhoodRows);
    if (nError) {
      return NextResponse.json({ error: nError.message ?? "Failed to save neighborhoods" }, { status: 500 });
    }
  }

  return NextResponse.json({ tripId: trip.id }, { status: 201 });
}

