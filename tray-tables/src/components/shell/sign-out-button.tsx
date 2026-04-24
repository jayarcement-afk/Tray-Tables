"use client";

import { useMemo } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/auth";
  }

  return (
    <button
      type="button"
      onClick={() => void signOut()}
      className="rounded-lg px-2 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 sm:px-3"
    >
      Sign out
    </button>
  );
}
