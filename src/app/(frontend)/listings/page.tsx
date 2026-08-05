import { Suspense } from 'react'
import Link from 'next/link'
import { getCachedListings } from '@/lib/appfolio'
import { createMetadata } from '@/lib/seo'
import { getPageBySlug } from '@/lib/page-content'
import { isListingPetFriendly } from '@/lib/listing-utils'
import { ListingFilters } from '@/components/listings/ListingFilters'
import { ListingGrid } from '@/components/listings/ListingGrid'
import ListingsMapView from '@/components/listings/ListingsMapView'

export async function generateMetadata() {
  const page = await getPageBySlug('listings')
  return createMetadata({
    title: page?.meta?.title ?? page?.title ?? 'Available Rentals',
    description:
      page?.meta?.description ??
      'Browse available rental properties in Central Oregon. Homes and apartments for rent in Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras.',
    path: '/listings',
  })
}

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const page = await getPageBySlug('listings')
  const c = page?.listingsContent
  const allListings = await getCachedListings()

  // Most expensive first — showcases the premium inventory up top
  let filtered = [...allListings].sort(
    (a, b) => (b.AdvertisedRent ?? 0) - (a.AdvertisedRent ?? 0),
  )

  const isMapView = params.view === 'map'
  // Preserve active filters when toggling between list and map views
  const currentParams = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (typeof v === 'string' && k !== 'view' && k !== 'notice') currentParams.set(k, v)
  }
  const baseQuery = currentParams.toString()
  const listQuery = baseQuery ? `?${baseQuery}` : ''
  const mapQuery = `?${baseQuery ? baseQuery + '&' : ''}view=map`

  const city = typeof params.city === 'string' ? params.city : undefined
  const beds = typeof params.beds === 'string' ? params.beds : undefined
  const price = typeof params.price === 'string' ? params.price : undefined
  const pets = typeof params.pets === 'string' ? params.pets : undefined

  if (city) {
    filtered = filtered.filter(
      (l) => l.City.toLowerCase() === city.toLowerCase(),
    )
  }

  if (beds) {
    const minBeds = parseInt(beds, 10)
    if (!isNaN(minBeds)) {
      filtered = filtered.filter((l) => l.Bedrooms >= minBeds)
    }
  }

  if (price) {
    switch (price) {
      case 'under-1500':
        filtered = filtered.filter((l) => l.AdvertisedRent < 1500)
        break
      case '1500-2000':
        filtered = filtered.filter(
          (l) => l.AdvertisedRent >= 1500 && l.AdvertisedRent <= 2000,
        )
        break
      case '2000-2500':
        filtered = filtered.filter(
          (l) => l.AdvertisedRent >= 2000 && l.AdvertisedRent <= 2500,
        )
        break
      case '2500-plus':
        filtered = filtered.filter((l) => l.AdvertisedRent >= 2500)
        break
    }
  }

  if (pets === 'true') {
    filtered = filtered.filter(isListingPetFriendly)
  }

  const showUnavailableNotice = params.notice === 'unavailable'

  return (
    <div className="min-h-screen bg-neutral-light">
      {/* Expired-listing notice */}
      {showUnavailableNotice && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-medium text-amber-900">
              That property is no longer available — it may have just been
              rented. Here are our current listings, updated throughout the
              day.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <section className="bg-primary px-4 pb-10 pt-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-4">
            <ol className="flex items-center gap-2 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
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
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </li>
              <li className="text-white">Listings</li>
            </ol>
          </nav>

          <h1 className="font-heading text-display-sm sm:text-display text-white">
            {c?.heroHeading ?? 'Available Rentals'}
          </h1>
          <p className="mt-2 text-body-lg text-white/80">
            {c?.heroSubheading ?? 'Find your next home in Central Oregon'}
          </p>
        </div>
      </section>

      {/* Filters + Results */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-6">
          <Suspense fallback={null}>
            <ListingFilters />
          </Suspense>
        </div>

        {/* Results count + view toggle */}
        <div className="mb-6 mt-8 flex items-center justify-between gap-4">
          <p className="font-body text-sm text-neutral-mid">
            <span className="font-semibold text-neutral-dark">
              {filtered.length}
            </span>{' '}
            {filtered.length === 1 ? 'property' : 'properties'} available
          </p>
          <div className="flex overflow-hidden rounded-lg border border-neutral-200 text-sm font-semibold">
            <Link
              href={`/listings${listQuery}`}
              className={`px-4 py-2 ${!isMapView ? 'bg-accent text-white' : 'bg-white text-neutral-dark hover:bg-neutral-50'}`}
            >
              List
            </Link>
            <Link
              href={`/listings${mapQuery}`}
              className={`px-4 py-2 ${isMapView ? 'bg-accent text-white' : 'bg-white text-neutral-dark hover:bg-neutral-50'}`}
            >
              Map
            </Link>
          </div>
        </div>

        {isMapView ? <ListingsMapView /> : <ListingGrid listings={filtered} />}
      </div>
    </div>
  )
}
