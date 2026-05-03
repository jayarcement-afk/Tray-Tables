import { NextResponse } from "next/server";

import { checkGuessDishCountryAnswer } from "@/lib/guess-dish-country";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  dishId?: string;
  selectedLabel?: string;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const dishId = typeof body.dishId === "string" ? body.dishId.trim() : "";
  const selectedLabel =
    typeof body.selectedLabel === "string" ? body.selectedLabel : "";
  if (!dishId || !selectedLabel) {
    return NextResponse.json(
      { error: "dishId and selectedLabel are required." },
      { status: 400 }
    );
  }

  const result = checkGuessDishCountryAnswer(dishId, selectedLabel);
  if (!result) {
    return NextResponse.json({ error: "Unknown dish." }, { status: 400 });
  }

  return NextResponse.json(result);
}
