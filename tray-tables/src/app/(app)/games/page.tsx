import { redirect } from "next/navigation";

import { GuessDishCountryGame } from "@/components/games/guess-dish-country-game";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function GamesPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    redirect("/auth?next=" + encodeURIComponent("/games"));
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">Games</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Quick quizzes use dishes whose photos exist on the server (missing files are skipped so you
          don&apos;t see the gray “image not available” fallback).
        </p>
        <GuessDishCountryGame />
      </div>
    </div>
  );
}
