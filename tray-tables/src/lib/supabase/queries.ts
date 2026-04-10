import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function getUserOrRedirect() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return null;
  }
  return data.user;
}

export async function getProfile(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data ?? null;
}

export async function getDietaryConstraints(userId: string) {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("dietary_constraints")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  return data ?? [];
}

