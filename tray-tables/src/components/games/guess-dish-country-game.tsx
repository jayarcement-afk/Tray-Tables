"use client";

import { useCallback, useEffect, useState } from "react";

import { DishPhoto } from "@/components/dishes/dish-photo";

type Round = {
  dishId: string;
  imageUrl: string;
  choices: string[];
};

type Phase = "playing" | "revealed" | "error";

export function GuessDishCountryGame() {
  const [bootLoading, setBootLoading] = useState(true);
  const [phase, setPhase] = useState<Phase>("playing");
  const [checking, setChecking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [round, setRound] = useState<Round | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);
  const [revealedLabel, setRevealedLabel] = useState<string | null>(null);
  const [revealedDishName, setRevealedDishName] = useState<string | null>(null);

  const loadRound = useCallback(async (excludeDishId?: string | null) => {
    setBootLoading(true);
    setRound(null);
    setPhase("playing");
    setChecking(false);
    setErrorMessage(null);
    setSelectedLabel(null);
    setLastCorrect(null);
    setRevealedLabel(null);
    setRevealedDishName(null);
    try {
      const res = await fetch("/api/games/guess-dish-country/round", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ excludeDishId: excludeDishId ?? null }),
      });
      const json = (await res.json()) as Round & { error?: string };
      if (!res.ok) {
        setErrorMessage(json.error ?? "Could not start a round.");
        setRound(null);
        setPhase("error");
        setBootLoading(false);
        return;
      }
      setRound({
        dishId: json.dishId,
        imageUrl: json.imageUrl,
        choices: json.choices,
      });
      setPhase("playing");
      setBootLoading(false);
    } catch {
      setErrorMessage("Network error.");
      setRound(null);
      setPhase("error");
      setBootLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRound(null);
  }, [loadRound]);

  async function finalizeAnswer() {
    if (!round || !selectedLabel || phase !== "playing") return;
    setChecking(true);
    try {
      const res = await fetch("/api/games/guess-dish-country/check", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ dishId: round.dishId, selectedLabel }),
      });
      const json = (await res.json()) as {
        correct?: boolean;
        correctLabel?: string;
        dishName?: string;
        error?: string;
      };
      if (!res.ok) {
        setErrorMessage(json.error ?? "Could not check answer.");
        setPhase("error");
        setChecking(false);
        return;
      }
      if (
        typeof json.correct === "boolean" &&
        json.correctLabel &&
        typeof json.dishName === "string"
      ) {
        setLastCorrect(json.correct);
        setRevealedLabel(json.correctLabel);
        setRevealedDishName(json.dishName);
        if (json.correct) setScore((s) => s + 1);
        setPhase("revealed");
      }
    } catch {
      setErrorMessage("Network error.");
      setPhase("error");
    } finally {
      setChecking(false);
    }
  }

  function handleNext() {
    void loadRound(round?.dishId ?? null);
  }

  return (
    <section className="mt-10 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8">
      <div className="flex flex-col gap-2 border-b border-zinc-100 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-zinc-900">
            Guess the Dish&apos;s Country
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Pick the city and country where this dish belongs, then finalize your answer.
          </p>
        </div>
        <div
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-center sm:text-right"
          aria-live="polite"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">Score</p>
          <p className="text-lg font-semibold tabular-nums text-emerald-900">{score} correct</p>
        </div>
      </div>

      {errorMessage && phase === "error" ? (
        <p className="mt-6 text-sm text-red-700" role="alert">
          {errorMessage}
        </p>
      ) : null}

      {bootLoading && !round && phase !== "error" ? (
        <p className="mt-8 text-sm text-zinc-500">Loading a dish…</p>
      ) : null}

      {round ? (
        <div className="mt-6 space-y-6">
          <div className="overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
            <DishPhoto src={round.imageUrl} alt="Mystery dish" />
          </div>

          <fieldset>
            <legend className="mb-3 text-sm font-medium text-zinc-800">
              Where is this dish from?
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {round.choices.map((label, idx) => {
                const id = `choice-${idx}`;
                const disabled = phase === "revealed" || checking;
                const selected = selectedLabel === label;
                const isRevealedWrongPick =
                  phase === "revealed" &&
                  selected &&
                  selectedLabel === label &&
                  lastCorrect === false;
                const showCorrectHighlight =
                  phase === "revealed" && revealedLabel === label;

                return (
                  <label
                    key={label}
                    htmlFor={id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-3 text-sm transition sm:text-[15px] ${
                      disabled ? "cursor-default opacity-90" : "hover:border-zinc-400"
                    } ${
                      selected && phase === "playing"
                        ? "border-zinc-900 bg-zinc-100"
                        : "border-zinc-200 bg-white"
                    } ${
                      showCorrectHighlight
                        ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600/30"
                        : ""
                    } ${
                      isRevealedWrongPick
                        ? "border-red-400 bg-red-50 ring-1 ring-red-400/30"
                        : ""
                    }`}
                  >
                    <input
                      id={id}
                      type="radio"
                      name="location"
                      value={label}
                      checked={selected}
                      disabled={disabled}
                      onChange={() => {
                        if (!disabled) setSelectedLabel(label);
                      }}
                      className="size-4 shrink-0 border-zinc-300 text-zinc-900"
                    />
                    <span className="font-medium leading-snug text-zinc-900">{label}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>

          {phase === "revealed" && revealedLabel && revealedDishName ? (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                lastCorrect
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : "border-amber-200 bg-amber-50 text-amber-950"
              }`}
              role="status"
            >
              {lastCorrect ? (
                <p>
                  <span className="font-semibold">Correct!</span>{" "}
                  <span className="font-medium">{revealedDishName}</span> is from{" "}
                  <span className="font-medium">{revealedLabel}</span>.
                </p>
              ) : (
                <p>
                  <span className="font-semibold">Not quite.</span> That&apos;s{" "}
                  <span className="font-medium">{revealedDishName}</span>
                  {" — "}
                  the right location is{" "}
                  <span className="font-medium">{revealedLabel}</span>.
                </p>
              )}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center gap-3">
            {phase === "playing" ? (
              <button
                type="button"
                onClick={() => void finalizeAnswer()}
                disabled={!selectedLabel || checking}
                className="rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {checking ? "Checking…" : "Finalize answer"}
              </button>
            ) : null}

            {phase === "revealed" ? (
              <button
                type="button"
                onClick={handleNext}
                className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50"
              >
                Next dish
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
