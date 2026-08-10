import { permanentRedirect } from 'next/navigation'
import { SITE_URL } from '@/lib/site-url'
import Link from 'next/link'
import type { Metadata } from 'next'
import { getCachedListingById } from '@/lib/appfolio'
import { listingSchema, breadcrumbSchema } from '@/lib/schema'
import { isDogFriendlyPolicy, formatAvailableDate } from '@/lib/listing-utils'
import ShareListing from '@/components/listings/ShareListing'
import PhotoGallery from '@/components/listings/PhotoGallery'
import Button from '@/components/ui/Button'

// Use dynamic rendering — listing data from AppFolio v0 API is too large to SSG all at build time
export const dynamic = 'force-dynamic'

// ---------- Metadata ----------
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const listing = await getCachedListingById(id)
  if (!listing) return { title: 'Listing Not Found' }

  // Append the street address so listings with identical layouts (e.g. two
  // "1BR/1BA in Madras") get distinct titles for search engines.
  const title =
    listing.Address1 && !listing.MarketingTitle.includes(listing.Address1)
      ? `${listing.MarketingTitle} — ${listing.Address1}`
      : listing.MarketingTitle
  const description = `${listing.Bedrooms} bed / ${listing.Bathrooms} bath rental in ${listing.City}, OR — $${listing.AdvertisedRent.toLocaleString()}/mo. ${listing.MarketingDescription.slice(0, 120)}...`

  const photo = listing.UnitPhotos[0]?.Url

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
      url: `${SITE_URL}/listings/${listing.Id}`,
      ...(photo ? { images: [{ url: photo, alt: title }] } : {}),
    },
    twitter: {
      card: photo ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(photo ? { images: [photo] } : {}),
    },
  }
}

// ---------- Page ----------
export default async function ListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const listing = await getCachedListingById(id)
  // Expired/rented listings never 404 — visitors land on the listings page
  // with a "no longer available" notice instead
  if (!listing) permanentRedirect('/listings?notice=unavailable')

  const isPetFriendly =
    listing.CatsAllowed || isDogFriendlyPolicy(listing.DogPolicy)

  const availableDate = formatAvailableDate(listing.AvailableOn)

  const jsonLd = [
    listingSchema(listing),
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Listings', url: '/listings' },
      { name: listing.Address1, url: `/listings/${listing.Id}` },
    ]),
  ]

  return (
    <>
      {/* JSON-LD */}
      {jsonLd.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}

      <div className="min-h-screen bg-neutral-light">
        {/* Breadcrumb bar */}
        <div className="bg-primary px-4 py-4 sm:px-6 lg:px-8">
          <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl">
            <ol className="flex items-center gap-2 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronIcon />
              </li>
              <li>
                <Link
                  href="/listings"
                  className="transition-colors hover:text-white"
                >
                  Listings
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronIcon />
              </li>
              <li className="truncate text-white">{listing.Address1}</li>
            </ol>
          </nav>
        </div>

        {/* Photo gallery */}
        <PhotoGallery photos={listing.UnitPhotos} address={listing.Address1} />

        {/* Content */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-12">
            {/* Left column: details */}
            <div className="lg:col-span-2">
              {/* Title + Address */}
              <h1 className="font-heading text-2xl font-bold text-neutral-dark sm:text-3xl lg:text-4xl">
                {listing.MarketingTitle}
              </h1>
              <p className="mt-2 flex items-center gap-1.5 font-body text-neutral-mid">
                <svg aria-hidden="true"
                  className="h-4 w-4 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                </svg>
                {listing.Address1}, {listing.City}, {listing.State}{' '}
                {listing.Zip}
              </p>

              {/* Key stats */}
              <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard label="Bedrooms" value={String(listing.Bedrooms)} />
                <StatCard label="Bathrooms" value={String(listing.Bathrooms)} />
                <StatCard
                  label="Sq Ft"
                  value={listing.SquareFeet.toLocaleString()}
                />
                <StatCard
                  label="Rent / Month"
                  value={`$${listing.AdvertisedRent.toLocaleString()}`}
                  highlight
                />
              </div>

              {/* Available date */}
              <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700">
                <svg aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                  />
                </svg>
                {availableDate}
              </div>

              {/* Share */}
              <div className="mt-6">
                <ShareListing
                  url={`${SITE_URL}/listings/${listing.Id}`}
                  title={`${listing.MarketingTitle} — $${listing.AdvertisedRent.toLocaleString()}/mo | High Desert Property Management`}
                />
              </div>

              {/* Description */}
              <section className="mt-10">
                <h2 className="font-heading text-subtitle text-neutral-dark">
                  About This Property
                </h2>
                <p className="mt-3 font-body leading-relaxed text-neutral-mid whitespace-pre-line">
                  {listing.MarketingDescription}
                </p>
              </section>

              {/* Amenities */}
              {listing.UnitAmenities.length > 0 && (
                <section className="mt-10">
                  <h2 className="font-heading text-subtitle text-neutral-dark">
                    Amenities
                  </h2>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {listing.UnitAmenities.map((amenity) => (
                      <span
                        key={amenity}
                        className="inline-flex items-center rounded-full bg-primary/5 px-4 py-1.5 font-body text-sm font-medium text-primary"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </section>
              )}

              {/* Pet policy */}
              <section className="mt-10">
                <h2 className="font-heading text-subtitle text-neutral-dark">
                  Pet Policy
                </h2>
                <div className="mt-3 rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-full p-1.5 ${isPetFriendly ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}
                    >
                      {isPetFriendly ? (
                        <svg aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4.5 12.75l6 6 9-13.5"
                          />
                        </svg>
                      ) : (
                        <svg aria-hidden="true"
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="font-body text-sm">
                      <p className="text-neutral-dark">
                        <span className="font-medium">Cats:</span>{' '}
                        {listing.CatsAllowed ? 'Allowed' : 'Not allowed'}
                      </p>
                      <p className="mt-1 text-neutral-dark">
                        <span className="font-medium">Dogs:</span>{' '}
                        {listing.DogPolicy}
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Deposit */}
              <section className="mt-10">
                <h2 className="font-heading text-subtitle text-neutral-dark">
                  Deposit
                </h2>
                <p className="mt-3 font-body text-neutral-mid">
                  Security deposit:{' '}
                  <span className="font-semibold text-neutral-dark">
                    ${listing.Deposit.toLocaleString()}
                  </span>
                </p>
              </section>
            </div>

            {/* Right column: CTA sidebar */}
            <div className="mt-10 lg:mt-0">
              <div className="sticky top-8 rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
                <p className="font-heading text-3xl font-bold text-neutral-dark">
                  ${listing.AdvertisedRent.toLocaleString()}
                  <span className="text-lg font-normal text-neutral-mid">
                    /mo
                  </span>
                </p>

                <div className="mt-4 space-y-2 border-t border-neutral-100 pt-4 font-body text-sm text-neutral-mid">
                  <div className="flex justify-between">
                    <span>Bedrooms</span>
                    <span className="font-medium text-neutral-dark">
                      {listing.Bedrooms}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bathrooms</span>
                    <span className="font-medium text-neutral-dark">
                      {listing.Bathrooms}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Square Feet</span>
                    <span className="font-medium text-neutral-dark">
                      {listing.SquareFeet.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available</span>
                    <span className="font-medium text-neutral-dark">
                      {availableDate.replace(/^Available\s+/i, '')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Deposit</span>
                    <span className="font-medium text-neutral-dark">
                      ${listing.Deposit.toLocaleString()}
                    </span>
                  </div>
                </div>

                <Button
                  href={listing.ApplicationURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="primary"
                  size="lg"
                  className="mt-6 w-full"
                >
                  Apply Now
                </Button>

                <p className="mt-3 text-center font-body text-xs text-neutral-mid">
                  Application handled securely through AppFolio
                </p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-12 border-t border-neutral-200 pt-8">
            <Link
              href="/listings"
              className="inline-flex items-center gap-2 font-body text-sm font-medium text-primary transition-colors hover:text-primary-dark"
            >
              <svg aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              Back to all listings
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

// ---------- Sub-components ----------

function ChevronIcon() {
  return (
    <svg aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
    </svg>
  )
}

function StatCard({
  label,
  value,
  highlight = false,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`rounded-lg border p-4 text-center ${
        highlight
          ? 'border-accent/30 bg-accent/5'
          : 'border-neutral-200 bg-white'
      }`}
    >
      <p
        className={`font-heading text-2xl font-bold ${highlight ? 'text-accent' : 'text-neutral-dark'}`}
      >
        {value}
      </p>
      <p className="mt-1 font-body text-xs text-neutral-mid">{label}</p>
    </div>
  )
}
