import { Suspense } from 'react'
import Link from 'next/link'
import { getCachedListings } from '@/lib/appfolio'
import { createMetadata } from '@/lib/seo'
import { ListingFilters } from '@/components/listings/ListingFilters'
import { ListingGrid } from '@/components/listings/ListingGrid'

export const metadata = createMetadata({
  title: 'Available Rentals',
  description:
    'Browse available rental properties in Central Oregon. Homes and apartments for rent in Bend, Redmond, Sisters, Prineville, La Pine, and Madras.',
  path: '/listings',
})

export default async function ListingsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const allListings = await getCachedListings()

  // Apply filters server-side
  let filtered = allListings

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
    filtered = filtered.filter(
      (l) => l.CatsAllowed || l.DogPolicy.toLowerCase() !== 'no dogs',
    )
  }

  return (
    <div className="min-h-screen bg-neutral-light">
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

          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl">
            Available Rentals
          </h1>
          <p className="mt-2 text-lg text-white/80">
            Find your next home in Central Oregon
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

        {/* Results count */}
        <p className="mb-6 mt-8 font-body text-sm text-neutral-mid">
          <span className="font-semibold text-neutral-dark">
            {filtered.length}
          </span>{' '}
          {filtered.length === 1 ? 'property' : 'properties'} available
        </p>

        <ListingGrid listings={filtered} />
      </div>
    </div>
  )
}
