"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

import { PASSPORT_STAMP_DOC_IMAGE_SRC } from "@/data/culinary-passport-stamp-doc-images";
import {
  CULINARY_PASSPORT_STAMPS,
  PASSPORT_STAMPS_PER_PAGE,
  PASSPORT_VISA_PAGE_COUNT,
  activeColorForStamp,
  isStampUnlocked,
} from "@/data/culinary-passport-stamps";
import type { PassportStampDef } from "@/data/culinary-passport-stamps";
import type { PassportStats } from "@/lib/culinary-passport-stats";

/** Warm paper sampled from doc stamp PNGs (e.g. stamp-01 edges ≈ #f4e7d5) — visa pages match this. */
const PASSPORT_VISA_PAPER = "#f4e7d5";
const PASSPORT_VISA_PAPER_DEEP = "#e8d9c8";
const PASSPORT_VISA_PAPER_HIGHLIGHT = "#faf3e8";
const PASSPORT_VISA_INK = "#3d3429";
const PASSPORT_VISA_RULE = "#c9b89a";

function stampsForVisaPage(page: number): PassportStampDef[] {
  const start = (page - 1) * PASSPORT_STAMPS_PER_PAGE + 1;
  const end = Math.min(page * PASSPORT_STAMPS_PER_PAGE, CULINARY_PASSPORT_STAMPS.length);
  return CULINARY_PASSPORT_STAMPS.filter((s) => s.number >= start && s.number <= end);
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}

function PassportStampVisual({
  stamp,
  unlocked,
}: {
  stamp: PassportStampDef;
  unlocked: boolean;
}) {
  const docSrc = PASSPORT_STAMP_DOC_IMAGE_SRC[stamp.number];

  if (docSrc) {
    return (
      <div className="flex flex-col items-center gap-1.5 overflow-visible">
        <div
          className={`relative h-[6.75rem] w-[6.75rem] shrink-0 overflow-visible sm:h-[7.25rem] sm:w-[7.25rem] ${
            unlocked ? "" : "opacity-[0.42] grayscale"
          }`}
          aria-hidden
        >
          <Image
            src={docSrc}
            alt=""
            fill
            unoptimized
            className="origin-center scale-[1.06] object-contain drop-shadow-[0_1px_2px_rgba(61,52,41,0.18),0_5px_12px_-3px_rgba(61,52,41,0.2)]"
            sizes="(max-width: 640px) 124px, 132px"
          />
        </div>
        <p
          className={`max-w-[8rem] text-center text-[10px] font-medium leading-snug sm:max-w-[9rem] sm:text-xs ${
            unlocked ? "" : "text-zinc-400"
          }`}
          style={unlocked ? { color: PASSPORT_VISA_INK } : undefined}
        >
          {stamp.name}
        </p>
      </div>
    );
  }

  const color = activeColorForStamp(stamp.number);
  const numFill = unlocked ? "#ffffff" : "#52525b";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="flex h-[6.75rem] w-[6.75rem] shrink-0 items-center justify-center sm:h-[7.25rem] sm:w-[7.25rem]"
        aria-hidden
      >
        <svg
          viewBox="0 0 88 72"
          className="h-auto w-[6.1rem] max-h-[5.75rem] shrink-0 drop-shadow-sm sm:w-[6.5rem] sm:max-h-[6rem]"
          preserveAspectRatio="xMidYMid meet"
        >
          <rect
            x="4"
            y="4"
            width="80"
            height="64"
            rx="4"
            fill={unlocked ? color : "#d4d4d8"}
            stroke={unlocked ? "#262626" : "#a3a3a3"}
            strokeWidth="2"
            strokeDasharray={unlocked ? undefined : "4 3"}
            opacity={unlocked ? 1 : 0.95}
          />
          <text
            x="44"
            y="42"
            textAnchor="middle"
            fill={numFill}
            fontSize="14"
            fontWeight="700"
            fontFamily="ui-sans-serif, system-ui, sans-serif"
          >
            {stamp.number}
          </text>
        </svg>
      </div>
      <p
        className={`max-w-[8rem] text-center text-[10px] font-medium leading-snug sm:max-w-[9rem] sm:text-xs ${
          unlocked ? "" : "text-zinc-400"
        }`}
        style={unlocked ? { color: PASSPORT_VISA_INK } : undefined}
      >
        {stamp.name}
      </p>
    </div>
  );
}

/**
 * Raster from your reference artwork (`public/culinary-passport-globe-logo.png`), recolored to
 * `#ece2c6` with white knocked out to alpha (`culinary-passport-globe-logo-cream.png`) so it sits on the navy cover.
 */
function PassportCoverGlobeLogo({ className }: { className?: string }) {
  return (
    <div className={`mx-auto flex w-full max-w-[240px] justify-center sm:max-w-[280px] ${className ?? ""}`}>
      <Image
        src="/culinary-passport-globe-logo-cream.png"
        width={546}
        height={544}
        alt=""
        unoptimized
        className="h-auto w-full max-h-[11.5rem] object-contain sm:max-h-[13rem]"
        sizes="(max-width: 640px) 240px, 280px"
        aria-hidden
      />
    </div>
  );
}

/**
 * ICAO-style biometric symbol from your reference (`public/culinary-passport-biometric-chip.png`),
 * navy → alpha and gold → `#ece2c6` (`culinary-passport-biometric-chip-cream.png`).
 */
function PassportCoverBiometricChip({ className }: { className?: string }) {
  return (
    <Image
      src="/culinary-passport-biometric-chip-cream.png"
      width={96}
      height={60}
      alt=""
      unoptimized
      className={`h-6 w-auto object-contain opacity-95 sm:h-7 ${className ?? ""}`}
      sizes="96px"
      aria-hidden
    />
  );
}

function isPassportStatsPayload(x: unknown): x is PassportStats {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return typeof o.restaurantsDinedCount === "number" && typeof o.uniqueCountries === "number";
}

export function CulinaryPassportBook({ stats: statsFromServer }: { stats: PassportStats }) {
  const [open, setOpen] = useState(false);
  const [visaPage, setVisaPage] = useState(1);
  const [stats, setStats] = useState(statsFromServer);

  useEffect(() => {
    setStats(statsFromServer);
  }, [statsFromServer]);

  useEffect(() => {
    let cancelled = false;
    async function pull() {
      try {
        const res = await fetch("/api/passport/stats", { cache: "no-store" });
        if (cancelled || !res.ok) return;
        const json: unknown = await res.json();
        if (!cancelled && isPassportStatsPayload(json)) setStats(json);
      } catch {
        // keep last known stats
      }
    }
    void pull();
    const onVisible = () => {
      if (document.visibilityState === "visible") void pull();
    };
    window.addEventListener("focus", pull);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", pull);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const unlockedByNumber = useMemo(() => {
    const m = new Map<number, boolean>();
    for (const s of CULINARY_PASSPORT_STAMPS) {
      m.set(s.number, isStampUnlocked(s, stats));
    }
    return m;
  }, [stats]);

  const restaurantLabel = `${stats.restaurantsDinedCount} ${plural(
    stats.restaurantsDinedCount,
    "Restaurant",
    "Restaurants"
  )} Dined at`;
  const countryLabel = `Across ${stats.uniqueCountries} ${plural(
    stats.uniqueCountries,
    "Country",
    "Countries"
  )}`;

  if (!open) {
    return (
      <div className="mx-auto w-full max-w-md">
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setVisaPage(1);
          }}
          className="group w-full rounded-2xl bg-[#0a1172] p-8 pb-7 text-left shadow-[0_12px_40px_rgba(10,17,114,0.35)] ring-1 ring-black/20 transition hover:bg-[#0c1580] hover:shadow-[0_16px_48px_rgba(10,17,114,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ece2c6]"
        >
          <p className="text-center font-sans text-[0.7rem] font-medium uppercase tracking-[0.45em] text-[#ece2c6] sm:text-xs sm:tracking-[0.5em]">
            Culinary Passport
          </p>
          <div className="mx-auto mt-6 flex max-w-[220px] justify-center sm:max-w-[260px]">
            <PassportCoverGlobeLogo />
          </div>
          <div className="mx-auto mt-6 max-w-[260px] space-y-1 text-center text-xs font-medium leading-snug text-[#ece2c6]/90 sm:text-[13px]">
            <p>{restaurantLabel}</p>
            <p className="text-[#ece2c6]/75">{countryLabel}</p>
          </div>
          <div className="mx-auto mt-5 flex w-32 flex-col gap-1.5 sm:w-36" aria-hidden>
            <div className="h-px bg-[#ece2c6]/55" />
            <div className="h-px bg-[#ece2c6]/55" />
          </div>
          <div className="mx-auto mt-4 flex justify-center">
            <PassportCoverBiometricChip />
          </div>
          <p className="mt-5 text-center text-[10px] font-medium uppercase tracking-[0.25em] text-[#ece2c6]/50">
            Tap to open
          </p>
          <p className="sr-only">Open culinary passport</p>
        </button>
      </div>
    );
  }

  const pageStamps = stampsForVisaPage(visaPage);

  return (
    <div className="mx-auto w-full max-w-lg">
      <div
        className="overflow-visible rounded-2xl border p-4 shadow-md sm:p-6"
        style={{
          borderColor: PASSPORT_VISA_RULE,
          background: `linear-gradient(165deg, ${PASSPORT_VISA_PAPER_HIGHLIGHT} 0%, ${PASSPORT_VISA_PAPER} 38%, ${PASSPORT_VISA_PAPER_DEEP} 100%)`,
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 24px rgba(61,52,41,0.08)",
        }}
      >
        <div
          className="flex items-start justify-between gap-2 border-b pb-3"
          style={{ borderColor: `${PASSPORT_VISA_RULE}cc` }}
        >
          <div>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.35em]"
              style={{ color: `${PASSPORT_VISA_INK}99` }}
            >
              Visas
            </p>
            <p className="mt-0.5 text-sm font-medium" style={{ color: PASSPORT_VISA_INK }}>
              Page {visaPage} of {PASSPORT_VISA_PAGE_COUNT}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="shrink-0 rounded-lg border px-2.5 py-1 text-xs font-medium transition hover:brightness-[0.98]"
            style={{
              borderColor: PASSPORT_VISA_RULE,
              backgroundColor: PASSPORT_VISA_PAPER_HIGHLIGHT,
              color: PASSPORT_VISA_INK,
            }}
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-7 overflow-visible sm:grid-cols-3 sm:gap-x-6 sm:gap-y-8">
          {pageStamps.map((stamp) => (
            <PassportStampVisual
              key={stamp.number}
              stamp={stamp}
              unlocked={unlockedByNumber.get(stamp.number) ?? false}
            />
          ))}
        </div>

        <div
          className="mt-6 flex items-center justify-between gap-2 border-t pt-4"
          style={{ borderColor: `${PASSPORT_VISA_RULE}cc` }}
        >
          <button
            type="button"
            disabled={visaPage <= 1}
            onClick={() => setVisaPage((p) => Math.max(1, p - 1))}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 hover:brightness-[0.98]"
            style={{
              borderColor: PASSPORT_VISA_RULE,
              backgroundColor: PASSPORT_VISA_PAPER_HIGHLIGHT,
              color: PASSPORT_VISA_INK,
            }}
          >
            Previous
          </button>
          <button
            type="button"
            disabled={visaPage >= PASSPORT_VISA_PAGE_COUNT}
            onClick={() => setVisaPage((p) => Math.min(PASSPORT_VISA_PAGE_COUNT, p + 1))}
            className="rounded-lg border px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40 hover:brightness-[0.98]"
            style={{
              borderColor: PASSPORT_VISA_RULE,
              backgroundColor: PASSPORT_VISA_PAPER_HIGHLIGHT,
              color: PASSPORT_VISA_INK,
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
