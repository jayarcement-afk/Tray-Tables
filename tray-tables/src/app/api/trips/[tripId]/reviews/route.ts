import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

type DishReview = {
  rating: number;
  experienceReview: string;
  tags: string[];
  photos: string[];
};

type ReviewPayload = {
  reviews: Record<string, DishReview>;
};

function sanitizeReview(input: DishReview): DishReview {
  const rating = Math.max(0, Math.min(5, Math.trunc(Number(input.rating) || 0)));
  const experienceReview = String(input.experienceReview ?? "").slice(0, 5000);
  const tags = Array.isArray(input.tags)
    ? input.tags.filter((t): t is string => typeof t === "string").slice(0, 30)
    : [];
  const photos = Array.isArray(input.photos)
    ? input.photos.filter((p): p is string => typeof p === "string").slice(0, 8)
    : [];
  return { rating, experienceReview, tags, photos };
}

function hasReviewContent(r: DishReview): boolean {
  return r.rating > 0 || r.experienceReview.trim().length > 0 || r.tags.length > 0 || r.photos.length > 0;
}

async function requireOwnerTrip(tripId: string) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), supabase: null };
  const { data: trip, error } = await supabase
    .from("trips")
    .select("id")
    .eq("id", tripId)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }), supabase: null };
  if (!trip) return { error: NextResponse.json({ error: "Trip not found" }, { status: 404 }), supabase: null };
  return { error: null, supabase };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await context.params;
  const { error, supabase } = await requireOwnerTrip(tripId);
  if (error || !supabase) return error;

  const { data, error: readErr } = await supabase
    .from("trip_dish_reviews")
    .select("dish_id,rating,experience_review,tags,photos")
    .eq("trip_id", tripId);
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const reviews: Record<string, DishReview> = {};
  for (const row of data ?? []) {
    reviews[row.dish_id] = {
      rating: row.rating ?? 0,
      experienceReview: row.experience_review ?? "",
      tags: (row.tags ?? []) as string[],
      photos: (row.photos ?? []) as string[],
    };
  }
  return NextResponse.json({ reviews });
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await context.params;
  const { error, supabase } = await requireOwnerTrip(tripId);
  if (error || !supabase) return error;

  const body = (await request.json()) as ReviewPayload;
  const input = body.reviews ?? {};

  const rows = Object.entries(input)
    .map(([dishId, r]) => [dishId, sanitizeReview(r)] as const)
    .filter(([dishId, r]) => dishId.trim().length > 0 && hasReviewContent(r));

  const keepIds = rows.map(([dishId]) => dishId);
  const upsertRows = rows.map(([dishId, r]) => ({
    trip_id: tripId,
    dish_id: dishId,
    rating: r.rating,
    experience_review: r.experienceReview,
    tags: r.tags,
    photos: r.photos,
  }));

  if (upsertRows.length > 0) {
    const { error: upsertErr } = await supabase
      .from("trip_dish_reviews")
      .upsert(upsertRows, { onConflict: "trip_id,dish_id" });
    if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });
  }

  const { data: existing, error: existingErr } = await supabase
    .from("trip_dish_reviews")
    .select("dish_id")
    .eq("trip_id", tripId);
  if (existingErr) return NextResponse.json({ error: existingErr.message }, { status: 500 });

  const existingIds = (existing ?? []).map((r) => r.dish_id);
  const removeIds = existingIds.filter((id) => !keepIds.includes(id));
  if (removeIds.length > 0) {
    const { error: delErr } = await supabase
      .from("trip_dish_reviews")
      .delete()
      .eq("trip_id", tripId)
      .in("dish_id", removeIds);
    if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
