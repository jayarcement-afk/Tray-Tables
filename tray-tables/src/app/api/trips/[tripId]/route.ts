import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type PatchTripBody = {
  startDate?: string;
  endDate?: string;
  markComplete?: boolean;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await context.params;
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as PatchTripBody;
  if (body.markComplete) {
    const { data: currentTrip, error: currentTripError } = await supabase
      .from("trips")
      .select("start_date, end_date")
      .eq("id", tripId)
      .eq("user_id", userData.user.id)
      .maybeSingle();

    if (currentTripError) {
      return NextResponse.json({ error: currentTripError.message }, { status: 500 });
    }
    if (!currentTrip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const currentStart = new Date(currentTrip.start_date);
    const currentEnd = new Date(currentTrip.end_date);
    const originalDays =
      Number.isNaN(currentStart.getTime()) || Number.isNaN(currentEnd.getTime())
        ? 1
        : Math.max(
            1,
            Math.floor((currentEnd.getTime() - currentStart.getTime()) / 86_400_000) + 1
          );

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const completedEnd = yesterday.toISOString().slice(0, 10);

    const completedStartDate = new Date(yesterday);
    completedStartDate.setDate(completedStartDate.getDate() - (originalDays - 1));
    const completedStart = completedStartDate.toISOString().slice(0, 10);

    const { data: trip, error } = await supabase
      .from("trips")
      .update({
        start_date: completedStart,
        end_date: completedEnd,
      })
      .eq("id", tripId)
      .eq("user_id", userData.user.id)
      .select("id")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    if (!trip) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  }

  if (!body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Missing startDate or endDate" }, { status: 400 });
  }

  const start = new Date(body.startDate);
  const end = new Date(body.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }
  if (end < start) {
    return NextResponse.json({ error: "End date must be on or after start date" }, { status: 400 });
  }
  const dayCount = Math.floor((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (dayCount < 1 || dayCount > 20) {
    return NextResponse.json({ error: "Trip must be 1-20 days" }, { status: 400 });
  }

  const { data: trip, error } = await supabase
    .from("trips")
    .update({
      start_date: body.startDate,
      end_date: body.endDate,
    })
    .eq("id", tripId)
    .eq("user_id", userData.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!trip) {
    return NextResponse.json({ error: "Trip not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await context.params;

  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("trips")
    .delete()
    .eq("id", tripId)
    .eq("user_id", userData.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
