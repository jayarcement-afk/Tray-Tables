import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type MealType = "breakfast" | "lunch" | "dinner" | "late_night" | "street_food" | "snack";

type CreateTripBody = {
  cityId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  mealTypes: MealType[]; // applied to every day in MVP
  neighborhoodsByDate?: Record<string, string[]>; // YYYY-MM-DD -> names
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

  if (!body.cityId || !body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
  }
  const days = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (days < 1 || days > 14) {
    return NextResponse.json({ error: "Trip must be 1–14 days" }, { status: 400 });
  }

  const mealTypes = (body.mealTypes ?? []).length ? body.mealTypes : (["breakfast", "lunch", "dinner"] as MealType[]);

  // trips.user_id references public.profiles — ensure row exists (signup may not have run DB trigger yet).
  const { error: profileError } = await supabase.from("profiles").upsert(
    { user_id: userData.user.id },
    { onConflict: "user_id" }
  );
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const { data: trip, error: tripError } = await supabase
    .from("trips")
    .insert({
      user_id: userData.user.id,
      city_id: body.cityId,
      start_date: body.startDate,
      end_date: body.endDate,
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

