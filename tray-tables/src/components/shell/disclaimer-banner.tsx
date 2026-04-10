"use client";

import { useEffect, useMemo, useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export function DisclaimerBanner() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data: constraints } = await supabase
        .from("dietary_constraints")
        .select("id")
        .limit(1);

      if (!cancelled) setShow((constraints?.length ?? 0) > 0);
    }
    void run();

    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void run();
    });
    return () => {
      cancelled = true;
      sub?.subscription.unsubscribe();
    };
  }, [supabase]);

  if (!show) return null;

  return (
    <div className="border-b border-amber-200 bg-amber-50">
      <div className="mx-auto flex w-full max-w-4xl items-start gap-3 px-6 py-3 text-sm text-amber-900">
        <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
        <div className="flex-1">
          <div className="font-medium">Dietary disclaimer</div>
          <div className="text-amber-800">
            Dietary/allergy info is AI-assisted and may be wrong. Always verify directly with restaurants.
          </div>
        </div>
        <button
          type="button"
          className="rounded-lg px-2 py-1 text-amber-900 hover:bg-amber-100"
          onClick={() => setShow(false)}
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

