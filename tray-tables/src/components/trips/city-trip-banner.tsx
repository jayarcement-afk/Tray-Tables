"use client";

import { useMemo, useState } from "react";

import { getCityBanner, proxiedBannerImageUrl } from "@/lib/city-banners";

type Props = {
  slug: string | null;
  cityName: string;
  country?: string | null;
};

/**
 * Full-width destination hero: cityscape image matched by `slug`, with readable overlay.
 */
export function CityTripBanner({ slug, cityName, country }: Props) {
  const banner = getCityBanner(slug);
  const src = banner?.url ?? "";
  const proxy = useMemo(() => (src ? proxiedBannerImageUrl(src) : null), [src]);

  const [stage, setStage] = useState<"direct" | "proxy" | "failed">(() =>
    banner ? "direct" : "failed"
  );

  if (!banner || stage === "failed") {
    return (
      <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-slate-800 via-slate-900 to-zinc-950 md:h-52">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-transparent to-transparent" />
        <div className="relative flex h-full flex-col justify-end px-6 pb-6 md:px-10">
          {country ? (
            <p className="text-xs font-medium uppercase tracking-wide text-white/75">
              {country}
            </p>
          ) : null}
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white md:text-4xl">
            {cityName}
          </h1>
        </div>
      </div>
    );
  }

  const href = stage === "proxy" && proxy ? proxy : src;

  return (
    <div className="relative h-44 w-full overflow-hidden md:h-56 lg:h-64">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={`${stage}-${href.slice(0, 80)}`}
        src={href}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        decoding="async"
        onError={() => {
          if (stage === "direct" && proxy) setStage("proxy");
          else setStage("failed");
        }}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/20"
        aria-hidden
      />
      <div className="relative flex h-full flex-col justify-end px-6 pb-5 md:px-10 md:pb-7">
        {country ? (
          <p className="text-xs font-medium uppercase tracking-wide text-white/85 drop-shadow">
            {country}
          </p>
        ) : null}
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-white drop-shadow-md md:text-4xl">
          {cityName}
        </h1>
        {banner.attribution ? (
          <p className="mt-2 max-w-2xl text-[11px] text-white/70 drop-shadow">
            {banner.attribution}
          </p>
        ) : null}
      </div>
    </div>
  );
}
