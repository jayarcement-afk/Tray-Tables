"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  tripId: string;
  /** "default" = outline on trip page; "inline" = compact on list */
  variant?: "default" | "inline";
};

export function DeleteTripButton({ tripId, variant = "default" }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    const ok = window.confirm(
      "Delete this trip? Meal slots and day plans for this trip will be removed. This cannot be undone."
    );
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/trips/${tripId}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Could not delete trip");
      router.push("/trips");
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Could not delete trip");
    } finally {
      setBusy(false);
    }
  }

  if (variant === "inline") {
    return (
      <button
        type="button"
        className="text-sm font-medium text-rose-600 underline underline-offset-4 hover:text-rose-700 disabled:opacity-50"
        disabled={busy}
        onClick={handleClick}
      >
        {busy ? "Deleting…" : "Delete"}
      </button>
    );
  }

  return (
    <button
      type="button"
      className="inline-flex h-10 items-center rounded-xl border border-rose-200 bg-white px-4 text-sm font-medium text-rose-700 hover:bg-rose-50 disabled:opacity-50"
      disabled={busy}
      onClick={handleClick}
    >
      {busy ? "Deleting…" : "Delete trip"}
    </button>
  );
}
