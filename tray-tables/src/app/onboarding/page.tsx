import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/auth");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: eater } = await supabase
    .from("eater_profiles")
    .select("*")
    .eq("user_id", data.user.id)
    .maybeSingle();

  const { data: constraints } = await supabase
    .from("dietary_constraints")
    .select("*")
    .eq("user_id", data.user.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold tracking-tight">
          Food preferences
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          These settings personalize dish surfacing now and restaurant recs later.
        </p>

        <div className="mt-6">
          <OnboardingForm
            initialProfile={profile}
            initialEater={eater}
            initialConstraints={constraints ?? []}
          />
        </div>
      </div>
    </div>
  );
}

