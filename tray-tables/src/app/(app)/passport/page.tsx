import { redirect } from "next/navigation";

import { CulinaryPassportBook } from "@/components/passport/culinary-passport-book";
import { loadPassportStats } from "@/lib/culinary-passport-stats";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Always read fresh trip/dish data for the passport (avoid stale RSC cache on client navigations). */
export const dynamic = "force-dynamic";

export default async function PassportPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/auth?next=" + encodeURIComponent("/passport"));
  }

  const stats = await loadPassportStats(supabase, data.user.id);

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Culinary Passport</h1>
          <p className="mt-1 text-sm text-zinc-600">Stamps unlock from your past trips.</p>
        </div>
        <CulinaryPassportBook stats={stats} />
      </div>
    </div>
  );
}
