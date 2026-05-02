"use client";

import { useMemo, useState } from "react";

const EATER_TYPES = [
  { id: "veggie_lover", label: "Veggie Lover" },
  { id: "adventurous_eater", label: "Adventurous Eater" },
  { id: "comfort_seeker", label: "Comfort Seeker" },
  { id: "local_purist", label: "Local Purist" },
  { id: "trendy_explorer", label: "Trendy Explorer" },
  { id: "street_food_lover", label: "Street Food Lover" },
  { id: "fine_dining_enthusiast", label: "Fine Dining Enthusiast" },
  { id: "foodie_completist", label: "Foodie Completist" },
] as const;

const CONSTRAINTS = [
  { id: "vegetarian", label: "Vegetarian" },
  { id: "vegan", label: "Vegan" },
  { id: "gluten_free", label: "Gluten‑free" },
  { id: "dairy_free", label: "Dairy‑free" },
  { id: "nut_allergy", label: "Nut allergy" },
  { id: "shellfish_allergy", label: "Shellfish allergy" },
  { id: "halal", label: "Halal" },
  { id: "kosher", label: "Kosher" },
  { id: "alcohol_free", label: "Alcohol‑free (pairings)" },
] as const;

type ConstraintId = (typeof CONSTRAINTS)[number]["id"];
type Strictness = "strict" | "flexible";
type Spice = "low" | "medium" | "high";
type Price = "$" | "$$" | "$$$" | "$$$$";

type InitialProfile = {
  display_name?: string | null;
  first_time_visitor?: boolean | null;
} | null;

type InitialEater = {
  eater_types?: string[] | null;
  spice?: Spice | null;
  price?: Price | null;
  opt_in_drink_pairings?: boolean | null;
} | null;

type InitialConstraint = {
  constraint_type: ConstraintId;
  strictness: Strictness;
};

function randomSessionId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return String(Date.now());
}

export function OnboardingForm({
  initialProfile,
  initialEater,
  initialConstraints,
}: {
  initialProfile: InitialProfile;
  initialEater: InitialEater;
  initialConstraints: InitialConstraint[];
}) {
  const [displayName, setDisplayName] = useState(initialProfile?.display_name ?? "");
  const [firstTimeVisitor, setFirstTimeVisitor] = useState(
    initialProfile?.first_time_visitor ?? true
  );

  const [eaterTypes, setEaterTypes] = useState<string[]>(
    (initialEater?.eater_types ?? []).filter(Boolean) as string[]
  );
  const [spice, setSpice] = useState<Spice>((initialEater?.spice ?? "medium") as Spice);
  const [price, setPrice] = useState<Price>((initialEater?.price ?? "$$") as Price);
  const [optInDrinkPairings, setOptInDrinkPairings] = useState(
    Boolean(initialEater?.opt_in_drink_pairings ?? false)
  );

  const [constraints, setConstraints] = useState<Record<string, Strictness>>(() => {
    const out: Record<string, Strictness> = {};
    for (const c of initialConstraints) out[c.constraint_type] = c.strictness;
    return out;
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const sessionId = useMemo(() => randomSessionId(), []);

  const hasConstraints = Object.keys(constraints).length > 0;

  function toggleEater(id: string) {
    setEaterTypes((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleConstraint(id: ConstraintId) {
    setConstraints((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = "strict";
      return next;
    });
  }

  function setConstraintStrictness(id: ConstraintId, strictness: Strictness) {
    setConstraints((prev) => ({ ...prev, [id]: strictness }));
  }

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const body = {
        displayName: displayName.trim() ? displayName.trim() : undefined,
        firstTimeVisitor,
        eaterTypes,
        spice,
        price,
        optInDrinkPairings,
        constraints: Object.entries(constraints).map(([type, strictness]) => ({
          type,
          strictness,
        })),
        disclaimerAccepted: hasConstraints
          ? {
              sessionId,
            }
          : undefined,
      };

      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Failed to save");

      window.location.href = "/trips";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (hasConstraints && !disclaimerAccepted) {
      setShowDisclaimer(true);
      return;
    }
    await save();
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <span className="text-sm font-medium">Display name (optional)</span>
          <input
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
        </label>

        <div className="sm:col-span-2">
          <div className="text-sm font-medium">Trip familiarity</div>
          <div className="mt-2 flex rounded-xl bg-zinc-100 p-1 text-sm">
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 ${
                firstTimeVisitor ? "bg-white shadow-sm" : "text-zinc-600"
              }`}
              onClick={() => setFirstTimeVisitor(true)}
            >
              First-time visitor
            </button>
            <button
              type="button"
              className={`flex-1 rounded-lg px-3 py-2 ${
                !firstTimeVisitor ? "bg-white shadow-sm" : "text-zinc-600"
              }`}
              onClick={() => setFirstTimeVisitor(false)}
            >
              Repeat visitor
            </button>
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Price preference</span>
          <select
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={price}
            onChange={(e) => setPrice(e.target.value as Price)}
          >
            <option value="$">$ (budget)</option>
            <option value="$$">$$ (mid)</option>
            <option value="$$$">$$$ (high)</option>
            <option value="$$$$">$$$$ (luxury)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium">Spice preference</span>
          <select
            className="h-11 rounded-xl border border-zinc-200 px-3 outline-none focus:border-zinc-400"
            value={spice}
            onChange={(e) => setSpice(e.target.value as Spice)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">Eater types</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {EATER_TYPES.map((t) => {
            const selected = eaterTypes.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleEater(t.id)}
                className={`h-10 rounded-xl border px-3 text-sm font-medium ${
                  selected
                    ? "border-zinc-900 bg-zinc-900 text-white"
                    : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-medium">Dietary & health constraints</div>
        <p className="mt-1 text-xs text-zinc-600">
          These act as hard filters later. We’ll always remind you to verify directly with restaurants.
        </p>
        <div className="mt-3 space-y-2">
          {CONSTRAINTS.map((c) => {
            const enabled = constraints[c.id] !== undefined;
            return (
              <div key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 px-3 py-2">
                <button
                  type="button"
                  className="flex items-center gap-2"
                  onClick={() => toggleConstraint(c.id)}
                >
                  <div
                    className={`h-5 w-5 rounded-md border ${
                      enabled ? "border-zinc-900 bg-zinc-900" : "border-zinc-300 bg-white"
                    }`}
                  />
                  <div className="text-sm font-medium">{c.label}</div>
                </button>

                {enabled ? (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      className={`h-8 rounded-lg px-2 font-medium ${
                        constraints[c.id] === "strict"
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-800"
                      }`}
                      onClick={() => setConstraintStrictness(c.id, "strict")}
                    >
                      Strict
                    </button>
                    <button
                      type="button"
                      className={`h-8 rounded-lg px-2 font-medium ${
                        constraints[c.id] === "flexible"
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-800"
                      }`}
                      onClick={() => setConstraintStrictness(c.id, "flexible")}
                    >
                      Flexible
                    </button>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-3">
        <div>
          <div className="text-sm font-medium">Drink pairings</div>
          <div className="text-xs text-zinc-600">Optional; shown later on restaurant cards.</div>
        </div>
        <button
          type="button"
          onClick={() => setOptInDrinkPairings((v) => !v)}
          className={`h-9 rounded-xl px-3 text-sm font-medium ${
            optInDrinkPairings ? "bg-zinc-900 text-white" : "border border-zinc-200 bg-white"
          }`}
        >
          {optInDrinkPairings ? "Enabled" : "Disabled"}
        </button>
      </div>

      {error ? (
        <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50"
          onClick={() => (window.location.href = "/trips")}
          disabled={busy}
        >
          Cancel
        </button>
        <button
          type="button"
          className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-60"
          onClick={handleSubmit}
          disabled={busy}
        >
          Save
        </button>
      </div>

      {showDisclaimer ? (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="text-lg font-semibold">Health & safety disclaimer</div>
            <p className="mt-2 text-sm text-zinc-700">
              Dietary and allergy information is AI-assisted and may be incomplete or incorrect. You must confirm directly with
              restaurants before ordering or dining. Use this app at your own risk.
            </p>
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              By continuing, you acknowledge this limitation and accept responsibility for verifying ingredients and cross-contact risk.
            </div>
            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                className="h-11 rounded-xl border border-zinc-200 px-4 text-sm font-medium hover:bg-zinc-50"
                onClick={() => setShowDisclaimer(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="h-11 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800"
                onClick={() => {
                  setDisclaimerAccepted(true);
                  setShowDisclaimer(false);
                  void save();
                }}
              >
                I understand, continue
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

