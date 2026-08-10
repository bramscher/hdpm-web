import Link from 'next/link'
import type { AppFolioListing } from '@/lib/appfolio'
import ListingCard from '@/components/listings/ListingCard'
import Button from '@/components/ui/Button'
import Reveal from '@/components/ui/Reveal'
import Section from '@/components/ui/Section'

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
    <Section tone="white">
      {/* Section header */}
      <Reveal className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="font-heading text-overline uppercase text-accent">
            Available Now
          </p>
          <h2 className="mt-3 font-heading text-title text-neutral-dark">
            Featured Rentals
          </h2>
          <p className="mt-3 max-w-xl text-body-lg text-neutral-mid">
            Hand-picked homes across Central Oregon, ready for move-in.
          </p>
        </div>
        <Link
          href="/listings"
          className="group inline-flex items-center gap-2 text-sm font-semibold text-accent transition-colors hover:text-accent-dark"
        >
          View All Listings
          <svg aria-hidden="true"
            className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transform-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </Reveal>

      {/* Listing cards grid */}
      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {featured.map((listing, i) => (
          <Reveal
            key={listing.Id}
            delay={Math.min(i, 3) * 0.07}
            className="h-full [&>article]:h-full"
          >
            <ListingCard listing={listing} index={i} />
          </Reveal>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="mt-12 text-center">
        <Button href="/listings" variant="primary" size="md" withArrow>
          Browse All {listings.length} Available Rentals
        </Button>
      </div>
    </Section>
  )
}
