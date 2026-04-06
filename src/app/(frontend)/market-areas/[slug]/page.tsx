import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema, localBusinessSchema } from '@/lib/schema'
import { getCachedListingsByCity } from '@/lib/appfolio'
import { getMarketArea, marketAreaSlugs } from '@/lib/market-areas'
import ListingCard from '@/components/listings/ListingCard'

export function generateStaticParams() {
  return marketAreaSlugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const area = getMarketArea(slug)
  if (!area) return {}

  return createMetadata({
    title: area.seoTitle,
    description: area.seoDescription,
    path: `/market-areas/${area.slug}`,
  })
}

export default async function MarketAreaPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const area = getMarketArea(slug)
  if (!area) notFound()

  const listings = await getCachedListingsByCity(area.city)
  const featuredListings = listings.slice(0, 3)

  const jsonLd = [
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Market Areas', url: '/market-areas' },
      { name: area.city, url: `/market-areas/${area.slug}` },
    ]),
    localBusinessSchema(),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="relative flex min-h-[50vh] items-end overflow-hidden">
        <Image
          src={area.image}
          alt={area.imageAlt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-16 pt-32 sm:px-8 lg:px-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-white/60">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li>
                <Link href="/market-areas" className="transition-colors hover:text-white">
                  Market Areas
                </Link>
              </li>
              <li>
                <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-white font-medium">{area.city}</li>
            </ol>
          </nav>

          <h1 className="font-heading text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Property Management in{' '}
            <span className="relative">
              {area.city}
              <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent opacity-80" />
            </span>
          </h1>
          <p className="mt-4 max-w-2xl text-xl text-white/80 italic">
            {area.tagline}
          </p>
        </div>
      </section>

      {/* Quick Stats */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="py-8 text-center">
              <p className="font-heading text-3xl font-extrabold text-primary sm:text-4xl">
                {area.population.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-neutral-mid">Population</p>
            </div>
            <div className="py-8 text-center">
              <p className="font-heading text-3xl font-extrabold text-primary sm:text-4xl">
                ${area.medianRent.toLocaleString()}
              </p>
              <p className="mt-1 text-sm text-neutral-mid">Median Rent/Mo</p>
            </div>
            <div className="py-8 text-center">
              <p className="font-heading text-3xl font-extrabold text-primary sm:text-4xl">
                {area.state}
              </p>
              <p className="mt-1 text-sm text-neutral-mid">State</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-white py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              Local Expertise
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              About {area.city} Rentals
            </h2>

            <div className="mt-8 space-y-6 text-base leading-relaxed text-neutral-mid">
              {area.description.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Area Highlights */}
      <section className="bg-neutral-light py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-neutral-dark sm:text-3xl">
              Why {area.city}?
            </h2>
            <ul className="mt-8 space-y-4">
              {area.highlights.map((highlight, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg aria-hidden="true"
                    className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  <span className="text-neutral-mid">{highlight}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      {featuredListings.length > 0 && (
        <section className="bg-white py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
            <div className="flex items-end justify-between">
              <div>
                <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
                  Available Now
                </p>
                <h2 className="mt-3 font-heading text-2xl font-extrabold tracking-tight text-neutral-dark sm:text-3xl">
                  Rental Listings in {area.city}
                </h2>
              </div>
              <Link
                href={`/listings?city=${encodeURIComponent(area.city)}`}
                className="hidden items-center gap-1.5 text-sm font-semibold text-accent transition-colors hover:text-accent-dark sm:inline-flex"
              >
                View All
                <svg aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featuredListings.map((listing, i) => (
                <ListingCard key={listing.Id} listing={listing} index={i} />
              ))}
            </div>

            <div className="mt-8 text-center sm:hidden">
              <Link
                href={`/listings?city=${encodeURIComponent(area.city)}`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent"
              >
                View All {area.city} Listings
                <svg aria-hidden="true"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Why Choose HDPM */}
      <section className="bg-neutral-light py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-heading text-2xl font-extrabold tracking-tight text-neutral-dark sm:text-3xl">
              Why Choose HDPM in {area.city}?
            </h2>
            <p className="mt-6 text-base leading-relaxed text-neutral-mid">
              High Desert Property Management combines deep {area.city} market
              knowledge with professional systems that protect your investment.
              Our local team lives and works in Central Oregon, which means
              faster response times, stronger tenant relationships, and a
              hands-on approach you won&apos;t find with a distant management
              company.
            </p>
          </div>

          <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Local Market Expertise',
                description: `We know ${area.city} neighborhoods, pricing trends, and tenant expectations inside and out.`,
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                ),
                icon2: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                  />
                ),
              },
              {
                title: 'Thorough Tenant Screening',
                description:
                  'Credit checks, background verification, employment and rental history — we find reliable tenants who pay on time.',
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
                  />
                ),
              },
              {
                title: 'Fast Maintenance Response',
                description: `Our trusted vendor network in ${area.city} means repairs are handled quickly and cost-effectively.`,
                icon: (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.42 15.17l-5.384-3.19A2.625 2.625 0 015.25 9.75V4.5a.75.75 0 01.75-.75h12a.75.75 0 01.75.75v5.25a2.625 2.625 0 01-.786 2.23l-5.384 3.19a1.5 1.5 0 01-1.66 0z"
                  />
                ),
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl bg-white p-8 shadow-sm"
              >
                <div className="inline-flex rounded-lg bg-accent/10 p-3">
                  <svg aria-hidden="true"
                    className="h-6 w-6 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    {feature.icon}
                    {feature.icon2}
                  </svg>
                </div>
                <h3 className="mt-4 font-heading text-lg font-bold text-neutral-dark">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-mid">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="relative overflow-hidden py-24">
        <Image
          src={area.image}
          alt={area.imageAlt}
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center sm:px-8">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Looking for Property Management in {area.city}?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
            Whether you own a single rental home or a portfolio of properties in{' '}
            {area.city}, our team is ready to help. Schedule a free consultation
            and learn how we can maximize your investment.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/owners"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
            >
              Free Consultation
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
            <a
              href="tel:5415480383"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/20 px-8 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5"
            >
              <svg aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              (541) 548-0383
            </a>
          </div>

          <p className="mt-8 text-sm text-white/50">
            Serving {area.city} and all of Central Oregon since 2011
          </p>
        </div>
      </section>
    </>
  )
}
