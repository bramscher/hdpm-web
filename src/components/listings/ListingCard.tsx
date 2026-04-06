import Image from 'next/image'
import Link from 'next/link'
import type { AppFolioListing } from '@/lib/appfolio'

// Gradient placeholders when no photo available
const placeholderGradients = [
  'from-primary/80 to-primary-dark/90',
  'from-amber-700/80 to-orange-900/90',
  'from-emerald-700/80 to-emerald-900/90',
  'from-slate-600/80 to-slate-800/90',
  'from-rose-700/80 to-rose-900/90',
  'from-indigo-600/80 to-indigo-900/90',
]

function formatDate(dateStr: string): string {
  if (!dateStr) return 'Contact for availability'
  // Handle various date formats: "April 1, 2026", "2026-04-01", etc.
  const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00')
  if (isNaN(date.getTime())) return dateStr // Return raw string if can't parse
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isPetFriendly(listing: AppFolioListing): boolean {
  return (
    listing.CatsAllowed ||
    (listing.DogPolicy !== 'No dogs' && listing.DogPolicy !== '')
  )
}

export default function ListingCard({
  listing,
  index = 0,
}: {
  listing: AppFolioListing
  index?: number
}) {
  const hasPhoto = listing.UnitPhotos.length > 0 && listing.UnitPhotos[0].Url.length > 0
  const gradientClass = placeholderGradients[index % placeholderGradients.length]
  const petFriendly = isPetFriendly(listing)

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20">
      {/* Image / Placeholder */}
      <Link href={`/listings/${listing.Id}`} className="relative block aspect-[4/3] overflow-hidden">
        {hasPhoto ? (
          <Image
            src={listing.UnitPhotos[0].Url}
            alt={listing.MarketingTitle || `${listing.Address1}, ${listing.City}`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority={index < 3}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientClass}`}>
            <svg aria-hidden="true" className="h-16 w-16 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
          </div>
        )}

        {/* Price badge overlay */}
        <div className="absolute bottom-3 left-3 rounded-lg bg-white/95 px-3 py-1.5 shadow-md backdrop-blur-sm">
          <span className="font-heading text-xl font-extrabold text-accent">
            ${listing.AdvertisedRent.toLocaleString()}
          </span>
          <span className="text-xs text-neutral-mid">/mo</span>
        </div>

        {/* Pet badge */}
        {petFriendly && (
          <div className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-emerald-600/90 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-sm">
            <svg aria-hidden="true" className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.5 11.5c1.38 0 2.5-1.12 2.5-2.5S5.88 6.5 4.5 6.5 2 7.62 2 9s1.12 2.5 2.5 2.5zm15 0c1.38 0 2.5-1.12 2.5-2.5S20.88 6.5 19.5 6.5 17 7.62 17 9s1.12 2.5 2.5 2.5zm-3.5-4c1.38 0 2.5-1.12 2.5-2.5S17.38 2.5 16 2.5s-2.5 1.12-2.5 2.5S14.62 7.5 16 7.5zM8 7.5c1.38 0 2.5-1.12 2.5-2.5S9.38 2.5 8 2.5 5.5 3.62 5.5 5 6.62 7.5 8 7.5zm4 5.5c-1.5 0-4.5 1.5-4.5 4.5 0 1.5 1 2.5 2.5 2.5h4c1.5 0 2.5-1 2.5-2.5 0-3-3-4.5-4.5-4.5z" />
            </svg>
            Pet Friendly
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Address */}
        <Link href={`/listings/${listing.Id}`} className="hover:text-primary transition-colors">
          <h3 className="font-heading text-base font-bold text-neutral-dark leading-snug">
            {listing.Address1}
          </h3>
          <p className="mt-0.5 text-sm text-neutral-mid">
            {listing.City}, {listing.State} {listing.Zip}
          </p>
        </Link>

        {/* Beds / Baths / SqFt */}
        <div className="mt-4 flex items-center gap-4 border-t border-gray-100 pt-4 text-sm text-neutral-mid">
          <div className="flex items-center gap-1.5">
            <svg aria-hidden="true" className="h-4 w-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="font-semibold text-neutral-dark">{listing.Bedrooms}</span> bd
          </div>
          <div className="flex items-center gap-1.5">
            <svg aria-hidden="true" className="h-4 w-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-semibold text-neutral-dark">{listing.Bathrooms}</span> ba
          </div>
          <div className="flex items-center gap-1.5">
            <svg aria-hidden="true" className="h-4 w-4 text-primary/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
            </svg>
            <span className="font-semibold text-neutral-dark">{listing.SquareFeet.toLocaleString()}</span> sqft
          </div>
        </div>

        {/* Available date */}
        <p className="mt-3 text-xs text-neutral-mid">
          Available {formatDate(listing.AvailableOn)}
        </p>

        {/* Apply button */}
        <div className="mt-4 pt-1">
          <a
            href={listing.ApplicationURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-dark hover:shadow-md"
          >
            Apply Now
            <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  )
}
