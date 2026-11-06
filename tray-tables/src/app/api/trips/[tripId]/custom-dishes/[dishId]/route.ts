import { NextResponse } from "next/server";

import { uuidFromUserDishClientId } from "@/lib/trip-custom-dishes";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TRIP_CUSTOM_DISH_IMAGE_BUCKET } from "@/lib/trip-custom-dish-constants";

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

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ tripId: string; dishId: string }> }
) {
  const { tripId, dishId: rawDishParam } = await context.params;
  const { error, supabase } = await requireOwnerTrip(tripId);
  if (error || !supabase) return error;

  const decoded = decodeURIComponent(rawDishParam);
  const uuid = uuidFromUserDishClientId(decoded) ?? (/^[0-9a-f-]{36}$/i.test(decoded) ? decoded.toLowerCase() : null);

  if (!uuid) return NextResponse.json({ error: "Invalid dish id" }, { status: 400 });

  const { data: row, error: readErr } = await supabase
    .from("trip_custom_dishes")
    .select("image_storage_path")
    .eq("trip_id", tripId)
    .eq("id", uuid)
    .maybeSingle();

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });
  if (!row) return NextResponse.json({ error: "Dish not found" }, { status: 404 });

  const imgPath = row.image_storage_path?.trim()
    ? String(row.image_storage_path)
    : null;
  if (imgPath) {
    await supabase.storage.from(TRIP_CUSTOM_DISH_IMAGE_BUCKET).remove([imgPath]);
  }

  const { error: delErr } = await supabase
    .from("trip_custom_dishes")
    .delete()
    .eq("trip_id", tripId)
    .eq("id", uuid);

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
