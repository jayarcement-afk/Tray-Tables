import { NextResponse } from "next/server";

import { buildGuessDishCountryRound } from "@/lib/guess-dish-country";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Body = {
  excludeDishId?: string | null;
};

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let excludeDishId: string | null = null;
  try {
    const json = (await request.json()) as Body;
    excludeDishId =
      typeof json.excludeDishId === "string" && json.excludeDishId.trim()
        ? json.excludeDishId.trim()
        : null;
  } catch {
    excludeDishId = null;
  }

  const round = buildGuessDishCountryRound(excludeDishId);
  if (!round) {
    return NextResponse.json(
      { error: "No dishes with images available for this quiz." },
      { status: 503 }
    );
  }

  return NextResponse.json(round);
}
