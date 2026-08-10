export default function ListingsLoading() {
  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Dark page-title band (mirrors the listings hero) */}
      <section className="bg-primary px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb placeholder */}
          <div className="mb-4 h-4 w-32 animate-pulse rounded bg-white/10" />
          {/* h1 placeholder */}
          <div className="h-9 w-72 max-w-full animate-pulse rounded bg-white/20 sm:h-12" />
          {/* Sub-lede placeholder */}
          <div className="mt-3 h-5 w-96 max-w-full animate-pulse rounded bg-white/10" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Filter bar placeholder */}
        <div className="-mt-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-lg sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="h-10 flex-1 animate-pulse rounded-lg bg-neutral-200" />
              <div className="h-10 flex-1 animate-pulse rounded-lg bg-neutral-200" />
              <div className="h-10 flex-1 animate-pulse rounded-lg bg-neutral-200" />
              <div className="h-10 w-32 animate-pulse rounded-lg bg-neutral-200" />
            </div>
          </div>
        </div>

        {/* Results count placeholder */}
        <div className="mb-6 mt-8 h-5 w-40 animate-pulse rounded bg-neutral-200" />

        {/* Skeleton cards matching ListingCard geometry */}
        <div className="grid gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-sm"
            >
              <div className="aspect-[4/3] animate-pulse bg-neutral-200" />
              <div className="p-5">
                <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="mt-2 h-4 w-1/2 animate-pulse rounded bg-neutral-200" />
                <div className="mt-6 flex gap-4 border-t border-neutral-100 pt-4">
                  <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-12 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-16 animate-pulse rounded bg-neutral-200" />
                </div>
                <div className="mt-4 h-10 w-full animate-pulse rounded-lg bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
