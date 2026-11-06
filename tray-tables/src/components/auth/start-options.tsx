"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function StartOptions() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const continueAsGuest = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        throw new Error("Sign-in is not configured. Missing Supabase public environment variables.");
      }
      const { error: anonError } = await supabase.auth.signInAnonymously();
      if (anonError) throw anonError;
      window.location.href = "/trips";
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not start guest session.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold uppercase tracking-wide">TRAY TABLES</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Choose how you want to continue.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={continueAsGuest}
          disabled={busy}
          className="h-11 rounded-xl bg-zinc-900 px-4 font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          Use as Guest
        </button>
        <a
          href="/auth?email=1"
          className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-300 px-4 font-medium text-zinc-900 hover:bg-zinc-50"
        >
          Sign in / Sign up
        </a>
      </div>
    </div>
  );
}
