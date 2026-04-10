import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type EaterType =
  | "veggie_lover"
  | "adventurous_eater"
  | "comfort_seeker"
  | "local_purist"
  | "trendy_explorer"
  | "street_food_lover"
  | "fine_dining_enthusiast"
  | "foodie_completist";

type DietaryConstraintType =
  | "vegetarian"
  | "vegan"
  | "gluten_free"
  | "dairy_free"
  | "nut_allergy"
  | "shellfish_allergy"
  | "halal"
  | "kosher"
  | "alcohol_free";

type Strictness = "strict" | "flexible";
type Spice = "low" | "medium" | "high";
type Price = "$" | "$$" | "$$$" | "$$$$";

type Body = {
  displayName?: string;
  firstTimeVisitor: boolean;
  eaterTypes: EaterType[];
  spice: Spice;
  price: Price;
  optInDrinkPairings: boolean;
  constraints: Array<{ type: DietaryConstraintType; strictness: Strictness }>;
  disclaimerAccepted?: { sessionId?: string | null };
};

export async function POST(req: Request) {
  const supabase = await createSupabaseServerClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as Body;

  const userId = userData.user.id;

  // Upsert profile
  const { error: profileError } = await supabase.from("profiles").upsert({
    user_id: userId,
    display_name: body.displayName ?? null,
    first_time_visitor: body.firstTimeVisitor,
  });
  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  // Upsert eater profile
  const { error: eaterError } = await supabase.from("eater_profiles").upsert({
    user_id: userId,
    eater_types: body.eaterTypes ?? [],
    spice: body.spice,
    price: body.price,
    opt_in_drink_pairings: body.optInDrinkPairings,
  });
  if (eaterError) {
    return NextResponse.json({ error: eaterError.message }, { status: 500 });
  }

  // Replace constraints (simple MVP approach)
  const { error: deleteError } = await supabase
    .from("dietary_constraints")
    .delete()
    .eq("user_id", userId);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if ((body.constraints ?? []).length) {
    const { error: insertError } = await supabase
      .from("dietary_constraints")
      .insert(
        body.constraints.map((c) => ({
          user_id: userId,
          constraint_type: c.type,
          strictness: c.strictness,
        }))
      );
    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  // Disclaimer acceptance is required whenever constraints exist.
  const hasConstraints = (body.constraints ?? []).length > 0;
  if (hasConstraints) {
    const { error: acceptError } = await supabase
      .from("disclaimer_acceptances")
      .insert({
        user_id: userId,
        session_id: body.disclaimerAccepted?.sessionId ?? null,
        disclaimer_version: env.disclaimerVersion,
      });
    if (acceptError) {
      return NextResponse.json({ error: acceptError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ ok: true });
}

