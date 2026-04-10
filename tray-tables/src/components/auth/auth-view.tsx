"use client";

import { useMemo, useState } from "react";

import Link from "next/link";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Mode = "sign_in" | "sign_up";

export function AuthView() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentReset, setSentReset] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setSentReset(false);

    try {
      if (mode === "sign_up") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }

      window.location.href = "/trips";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetPassword() {
    setBusy(true);
    setError(null);
    setSentReset(false);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email,
        {
          redirectTo: `${window.location.origin}/auth/reset`,
        }
      );
      if (resetError) throw resetError;
      setSentReset(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h1 className="text-2xl font-bold uppercase tracking-wide">
          TRAY TABLES
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Discover hyper-local dishes and plan your trip’s meals.
        </p>
      </div>

      <div className="mb-4 flex rounded-xl bg-zinc-100 p-1 text-sm">
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 ${
            mode === "sign_in" ? "bg-white shadow-sm" : "text-zinc-600"
          }`}
          onClick={() => setMode("sign_in")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`flex-1 rounded-lg px-3 py-2 ${
            mode === "sign_up" ? "bg-white shadow-sm" : "text-zinc-600"
          }`}
          onClick={() => setMode("sign_up")}
        >
          Create account
        </button>
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Email</span>
          <input
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Password</span>
          <input
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete={
              mode === "sign_up" ? "new-password" : "current-password"
            }
            required
            minLength={8}
          />
        </label>

        {error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {sentReset ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Password reset email sent.
          </div>
        ) : null}

        <button
          className="mt-2 h-11 rounded-xl bg-zinc-900 px-4 font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          disabled={busy}
          type="submit"
        >
          {mode === "sign_in" ? "Sign in" : "Create account"}
        </button>

        <div className="flex items-center justify-between text-sm text-zinc-600">
          <button
            type="button"
            className="underline underline-offset-2"
            disabled={busy || !email}
            onClick={handleResetPassword}
          >
            Forgot password?
          </button>
          <Link className="underline underline-offset-2" href="/">
            Back home
          </Link>
        </div>
      </form>
    </div>
  );
}

