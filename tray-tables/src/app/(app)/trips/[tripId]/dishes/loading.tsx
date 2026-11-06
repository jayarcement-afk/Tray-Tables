export default function TripDishesLoading() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <div className="h-36 animate-pulse bg-zinc-200 sm:h-44" aria-hidden />
      <div className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-6 flex flex-wrap gap-2">
          <div className="h-4 w-14 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-4 animate-pulse rounded bg-zinc-200" />
          <div className="h-4 w-16 animate-pulse rounded bg-zinc-200" />
        </div>
        <div className="mb-2 h-9 w-56 max-w-full animate-pulse rounded-lg bg-zinc-200" />
        <div className="mb-8 h-4 w-full max-w-md animate-pulse rounded bg-zinc-200" />
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
            >
              <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
              <div className="space-y-3 p-5">
                <div className="h-6 w-[75%] animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-full animate-pulse rounded bg-zinc-100" />
                <div className="h-4 w-[66%] animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
