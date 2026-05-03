import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex min-h-[calc(100svh-3rem)] flex-1 flex-col">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url(/hero-landing.png)" }}
      />
      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-12 md:py-16">
        <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-black/30 p-8 text-center shadow-2xl backdrop-blur-md md:p-12">
          <p className="text-sm font-medium uppercase tracking-wide text-zinc-300">
            Tray Tables
          </p>
          <h1 className="mt-3 whitespace-nowrap text-[clamp(0.8125rem,4.15vw,2.25rem)] font-semibold leading-tight tracking-tight text-white drop-shadow-md">
            Eat like a local—anywhere.
          </h1>
          <p className="mt-4 text-base leading-7 text-zinc-200 drop-shadow-sm">
            Discover canonical regional dishes, build a food-forward trip plan,
            and avoid generic tourist dining.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/start"
              className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 font-medium text-zinc-900 shadow-lg hover:bg-zinc-100"
            >
              Get started
            </Link>
            <Link
              href="/trips"
              className="inline-flex h-11 items-center justify-center rounded-xl border border-white/35 bg-white/10 px-5 font-medium text-white backdrop-blur-sm hover:bg-white/20"
            >
              View trips
            </Link>
          </div>
          <p className="mt-6 text-center">
            <Link
              href="/games"
              className="text-sm font-medium text-white/90 underline decoration-white/40 underline-offset-4 hover:text-white"
            >
              Games
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
