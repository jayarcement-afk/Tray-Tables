import { NextResponse } from "next/server";

import { loadPassportStats } from "@/lib/culinary-passport-stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await loadPassportStats(supabase, data.user.id);
  return NextResponse.json(stats);
}
