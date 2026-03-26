import type { AppFolioListing } from '@/lib/appfolio'
import ListingCard from '@/components/listings/ListingCard'

interface ListingGridProps {
  listings: AppFolioListing[]
}

export function ListingGrid({ listings }: ListingGridProps) {
  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white py-20 text-center">
        <svg
          className="mb-4 h-16 w-16 text-neutral-mid/40"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
          />
        </svg>
        <h3 className="font-heading text-lg font-semibold text-neutral-dark">
          No properties match your filters
        </h3>
        <p className="mt-1 font-body text-sm text-neutral-mid">
          Try adjusting your search criteria or clearing filters.
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 pb-16 sm:grid-cols-2 lg:grid-cols-3">
      {listings.map((listing) => (
        <ListingCard key={listing.Id} listing={listing} />
      ))}
    </div>
  )
}
