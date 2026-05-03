import { NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  sortMealSlotsKeys,
  type MealSlotKey,
  type TripCustomDishApi,
} from "@/lib/trip-custom-dishes";
import {
  TRIP_CUSTOM_DISH_IMAGE_BUCKET,
  TRIP_CUSTOM_DISH_IMAGE_SIGN_SECS,
} from "@/lib/trip-custom-dish-constants";
import { linkIsMichelinGuide } from "@/lib/michelin-source";

type TripCustomDishRow = {
  id: string;
  trip_id: string;
  dish_name: string;
  restaurant: string;
  link_url: string | null;
  address?: string | null;
  why: string;
  drink_pairing: string;
  meal_slot: MealSlotKey;
  meal_slots?: string[] | null;
  tag_local_favorite: boolean;
  tag_trendy: boolean;
  tag_street_food: boolean;
  tag_vegetarian_options: boolean;
  tag_michelin_guide?: boolean;
  image_storage_path: string | null;
};

type CreatePayload = {
  restaurant?: string;
  dishName?: string;
  linkUrl?: string;
  address?: string;
  why?: string;
  drinkPairing?: string;
  /** Prefer this when adding from the app (multi-select). */
  mealSlots?: MealSlotKey[];
  /** Legacy single slot (migration / old clients). */
  mealSlot?: MealSlotKey;
  localFavorite?: boolean;
  trendy?: boolean;
  streetFood?: boolean;
  vegetarianOptions?: boolean;
  /** User says the source is the Michelin Guide; also set automatically when linkUrl is guide.michelin.com. */
  michelinGuide?: boolean;
};

const ALLOWED_SLOTS: MealSlotKey[] = ["breakfast", "lunch", "dinner", "late_night"];

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

async function signPath(
  supabase: NonNullable<Awaited<ReturnType<typeof requireOwnerTrip>>["supabase"]>,
  path: string | null
): Promise<string | null> {
  if (!path) return null;
  const { data, error } = await supabase.storage
    .from(TRIP_CUSTOM_DISH_IMAGE_BUCKET)
    .createSignedUrl(path, TRIP_CUSTOM_DISH_IMAGE_SIGN_SECS);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}

function rowMealSlots(row: TripCustomDishRow): MealSlotKey[] {
  const arr = row.meal_slots;
  if (Array.isArray(arr) && arr.length > 0) {
    const filtered = arr.filter((x): x is MealSlotKey =>
      ALLOWED_SLOTS.includes(x as MealSlotKey)
    );
    if (filtered.length) return sortMealSlotsKeys(filtered);
  }
  const one = ALLOWED_SLOTS.find((x) => x === row.meal_slot) ?? ("lunch" as MealSlotKey);
  return [one];
}

function rowToApi(row: TripCustomDishRow, signedImageUrl: string | null): TripCustomDishApi {
  return {
    id: row.id,
    dishName: row.dish_name,
    restaurant: row.restaurant,
    linkUrl: row.link_url,
    address: row.address?.trim() ? row.address.trim() : null,
    why: row.why,
    drinkPairing: row.drink_pairing,
    mealSlots: rowMealSlots(row),
    localFavorite: row.tag_local_favorite,
    trendy: row.tag_trendy,
    streetFood: row.tag_street_food,
    vegetarianOptions: row.tag_vegetarian_options,
    michelinGuide: Boolean(row.tag_michelin_guide),
    imageSignedUrl: signedImageUrl,
  };
}

function parseMealSlotsFromBody(body: CreatePayload): MealSlotKey[] {
  const raw = body.mealSlots;
  if (Array.isArray(raw) && raw.length > 0) {
    const uniq = new Set<MealSlotKey>();
    for (const x of raw) {
      if (typeof x !== "string") continue;
      const k = ALLOWED_SLOTS.find((s) => s === x);
      if (k) uniq.add(k);
    }
    if (uniq.size > 0) return sortMealSlotsKeys([...uniq]);
  }
  const single = ALLOWED_SLOTS.find((x) => x === body.mealSlot) ?? ("lunch" as MealSlotKey);
  return [single];
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await context.params;
  const { error, supabase } = await requireOwnerTrip(tripId);
  if (error || !supabase) return error;

  const { data, error: readErr } = await supabase
    .from("trip_custom_dishes")
    .select("*")
    .eq("trip_id", tripId)
    .order("created_at", { ascending: true });

  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const rows = (data ?? []) as TripCustomDishRow[];
  const signed = await Promise.all(rows.map((r) => signPath(supabase, r.image_storage_path)));
  const dishes: TripCustomDishApi[] = rows.map((row, i) => rowToApi(row, signed[i]));
  return NextResponse.json({ dishes });
}

export async function POST(
  request: Request,
  context: { params: Promise<{ tripId: string }> }
) {
  const { tripId } = await context.params;
  const { error, supabase } = await requireOwnerTrip(tripId);
  if (error || !supabase) return error;

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form payload" }, { status: 400 });
  }

  const rawPayload = fd.get("payload");
  if (!rawPayload || typeof rawPayload !== "string") {
    return NextResponse.json({ error: "Missing payload" }, { status: 400 });
  }

  let body: CreatePayload;
  try {
    body = JSON.parse(rawPayload) as CreatePayload;
  } catch {
    return NextResponse.json({ error: "Invalid payload JSON" }, { status: 400 });
  }

  const restaurant = String(body.restaurant ?? "").trim();
  const dishName = String(body.dishName ?? "").trim();
  if (!restaurant || !dishName) {
    return NextResponse.json({ error: "Restaurant and dish name are required." }, { status: 400 });
  }

  const mealSlots = parseMealSlotsFromBody(body);
  const mealSlot = mealSlots[0] ?? ("lunch" as MealSlotKey);

  let linkUrlClean: string | null = body.linkUrl ? String(body.linkUrl).trim() : null;
  if (linkUrlClean) {
    try {
      const u = new URL(linkUrlClean);
      if (u.protocol !== "http:" && u.protocol !== "https:") linkUrlClean = null;
    } catch {
      linkUrlClean = null;
    }
  } else linkUrlClean = null;

  const addressRaw = String(body.address ?? "").trim().slice(0, 500);
  const addressClean = addressRaw.length > 0 ? addressRaw : null;

  const why = String(body.why ?? "")
    .trim()
    .slice(0, 100);
  const drinkPairing = String(body.drinkPairing ?? "")
    .trim()
    .slice(0, 50);

  const insertRow = {
    trip_id: tripId,
    dish_name: dishName.slice(0, 200),
    restaurant: restaurant.slice(0, 200),
    link_url: linkUrlClean,
    address: addressClean,
    why,
    drink_pairing: drinkPairing,
    meal_slot: mealSlot,
    meal_slots: mealSlots,
    tag_local_favorite: Boolean(body.localFavorite),
    tag_trendy: Boolean(body.trendy),
    tag_street_food: Boolean(body.streetFood),
    tag_vegetarian_options: Boolean(body.vegetarianOptions),
    tag_michelin_guide:
      Boolean(body.michelinGuide) || linkIsMichelinGuide(linkUrlClean),
    image_storage_path: null as string | null,
  };

  const { data: inserted, error: insertErr } = await supabase
    .from("trip_custom_dishes")
    .insert(insertRow)
    .select("*")
    .maybeSingle();

  if (insertErr || !inserted) {
    return NextResponse.json(
      { error: insertErr?.message ?? "Could not save dish." },
      { status: 500 }
    );
  }

  const row = inserted as TripCustomDishRow;

  const imageFd = fd.get("image");
  if (imageFd && imageFd instanceof File && imageFd.size > 0) {
    const mime = imageFd.type.toLowerCase();
    const allowed =
      mime === "image/jpeg" ||
      mime === "image/jpg" ||
      mime === "image/png" ||
      mime === "image/webp";
    if (!allowed) {
      await supabase.from("trip_custom_dishes").delete().eq("id", row.id).eq("trip_id", tripId);
      return NextResponse.json(
        { error: "Images must be JPEG, PNG, or WebP." },
        { status: 400 }
      );
    }
    const ext = mime.includes("png") ? "png" : mime.includes("webp") ? "webp" : "jpg";
    const path = `${tripId}/${row.id}.${ext}`;
    const buf = Buffer.from(await imageFd.arrayBuffer());
    const { error: upErr } = await supabase.storage
      .from(TRIP_CUSTOM_DISH_IMAGE_BUCKET)
      .upload(path, buf, { contentType: mime || "image/jpeg", upsert: true });
    if (upErr) {
      await supabase.from("trip_custom_dishes").delete().eq("id", row.id).eq("trip_id", tripId);
      return NextResponse.json({ error: upErr.message }, { status: 500 });
    }
    const { error: pathErr } = await supabase
      .from("trip_custom_dishes")
      .update({ image_storage_path: path })
      .eq("id", row.id)
      .eq("trip_id", tripId);
    if (pathErr) {
      await supabase.storage.from(TRIP_CUSTOM_DISH_IMAGE_BUCKET).remove([path]);
      await supabase.from("trip_custom_dishes").delete().eq("id", row.id).eq("trip_id", tripId);
      return NextResponse.json({ error: pathErr.message }, { status: 500 });
    }
    row.image_storage_path = path;
  }

  const signed = await signPath(supabase, row.image_storage_path);
  return NextResponse.json({ dish: rowToApi(row, signed) }, { status: 201 });
}
