export default function BlogLoading() {
  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Dark page-title band (mirrors the blog hero) */}
      <section className="bg-primary px-4 pb-12 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          {/* h1 placeholder */}
          <div className="mx-auto h-9 w-56 max-w-full animate-pulse rounded bg-white/20 sm:h-12" />
          {/* Sub-lede placeholder */}
          <div className="mx-auto mt-4 h-5 w-80 max-w-full animate-pulse rounded bg-white/10" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Category filter pills placeholder */}
        <div className="-mt-5 mb-8">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="h-9 w-24 animate-pulse rounded-full bg-neutral-200"
              />
            ))}
          </div>
        </div>

        {/* Results count placeholder */}
        <div className="mb-6 h-5 w-32 animate-pulse rounded bg-neutral-200" />

        {/* Skeleton cards matching BlogPostCard geometry */}
        <div className="grid gap-8 pb-16 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-xl border border-neutral-200 bg-surface shadow-sm"
            >
              <div className="aspect-[16/10] animate-pulse bg-neutral-200" />
              <div className="p-5">
                <div className="h-4 w-5/6 animate-pulse rounded bg-neutral-200" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-neutral-200" />
                <div className="mt-2 h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                <div className="mt-6 flex items-center gap-3 border-t border-neutral-100 pt-4">
                  <div className="h-4 w-20 animate-pulse rounded bg-neutral-200" />
                  <div className="h-4 w-24 animate-pulse rounded bg-neutral-200" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
