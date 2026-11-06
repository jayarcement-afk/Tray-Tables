"use client";

import { useMemo, useState } from "react";

type Props = {
  src: string;
  alt: string;
};

const FALLBACK_SRC = "/dish-fallback.jpeg";

function proxiedUrl(original: string) {
  const trimmed = original.trim();
  if (
    trimmed.startsWith("https://images.unsplash.com/") ||
    trimmed.startsWith("https://upload.wikimedia.org/") ||
    trimmed.startsWith("https://placehold.co/")
  ) {
    return `/api/dish-image?u=${encodeURIComponent(trimmed)}`;
  }
  return null;
}

/**
 * Load order: (1) direct URL in the browser — same as opening the image in a new tab.
 * (2) If that errors, same-origin /api/dish-image proxy (helps strict networks).
 */
export function DishPhoto({ src, alt }: Props) {
  const cleaned = src.trim();
  const proxy = useMemo(() => proxiedUrl(cleaned), [cleaned]);

  const [stage, setStage] = useState<"direct" | "proxy" | "fallback" | "failed">(() => {
    if (!cleaned) return "fallback";
    return "direct";
  });

  if (stage === "failed") {
    return (
      <div className="flex aspect-[4/3] w-full min-h-[12rem] flex-col items-center justify-center gap-2 bg-zinc-200 px-4 text-center text-sm text-zinc-600">
        <span>Couldn’t load this image.</span>
        <span className="text-xs text-zinc-500">
          Re-run <code className="rounded bg-zinc-300 px-1">seed.sql</code> in Supabase if <code className="rounded bg-zinc-300 px-1">photo_url</code> is empty or wrong.
        </span>
      </div>
    );
  }

  const href =
    stage === "proxy" && proxy
      ? proxy
      : stage === "fallback"
        ? FALLBACK_SRC
        : cleaned;

  return (
    <div className="relative aspect-[4/3] min-h-[12rem] w-full min-w-0 overflow-hidden bg-zinc-100">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${stage}-${href.slice(0, 120)}`}
        src={href}
        alt={alt}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
        onError={() => {
          if (stage === "direct" && proxy) {
            setStage("proxy");
          } else if (stage !== "fallback") {
            setStage("fallback");
          } else {
            setStage("failed");
          }
        }}
      />
    </div>
  );
}
