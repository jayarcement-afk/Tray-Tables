"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function MarkCompleteButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const ok = window.confirm(
      "Mark this trip as complete? It will move to Past trips."
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ markComplete: true }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not mark trip complete");
      router.refresh();
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Could not mark trip complete"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="text-sm font-medium text-emerald-700 underline underline-offset-4 hover:text-emerald-800 disabled:opacity-50"
      disabled={busy}
      onClick={handleClick}
    >
      {busy ? "Updating…" : "Mark as Complete"}
    </button>
  );
}
