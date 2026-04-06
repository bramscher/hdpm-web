import Link from 'next/link'
import type { AppFolioListing } from '@/lib/appfolio'
import ListingCard from '@/components/listings/ListingCard'

export default function FeaturedListings({
  listings,
}: {
  listings: AppFolioListing[]
}) {
  const featured = listings.slice(0, 3)

  if (featured.length === 0) {
    return null
  }

  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              Available Now
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Featured Rentals
            </h2>
            <p className="mt-3 max-w-xl text-lg text-neutral-mid">
              Hand-picked homes across Central Oregon, ready for move-in.
            </p>
          </div>
          <Link
            href="/listings"
            className="group inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
          >
            View All Listings
            <svg aria-hidden="true"
              className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Listing cards grid */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((listing, i) => (
            <ListingCard key={listing.Id} listing={listing} index={i} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <Link
            href="/listings"
            className="inline-flex items-center gap-2 rounded-lg border-2 border-accent/20 px-6 py-3 text-sm font-semibold text-accent transition-all duration-200 hover:bg-accent hover:text-white hover:border-accent"
          >
            Browse All {listings.length} Available Rentals
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
