import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema, localBusinessSchema } from '@/lib/schema'
import Button from '@/components/ui/Button'
import type { MarketArea, Media } from '@/payload-types'

// Rendered on demand: this page reads CMS content from Payload/Postgres, and
// the build must not depend on the database being reachable and migrated
// (Preview deployments connect to a DB without the Payload schema).
export const dynamic = 'force-dynamic'

export const metadata = createMetadata({
  title: 'Property Management Across Central Oregon',
  description:
    'High Desert Property Management serves Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras. Local expertise in every Central Oregon market — find your area.',
  path: '/market-areas',
})

function getAreaImage(area: MarketArea): string {
  const heroImage = typeof area.heroImage === 'object' ? (area.heroImage as Media) : null
  return heroImage?.url || area.heroImageUrl || ''
}

export default async function MarketAreasPage() {
  const payload = await getPayload({ config })
  const { docs: areas } = await payload.find({
    collection: 'market-areas',
    where: { status: { equals: 'published' } },
    limit: 100,
    sort: '-population',
    depth: 1,
  })

  const jsonLd = [
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Market Areas', url: '/market-areas' },
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
      <section className="relative overflow-hidden bg-primary py-24 sm:py-32">
        {/* Subtle texture overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-heading text-overline uppercase text-accent-light">
              Our Service Areas
            </p>
            <h1 className="mt-3 font-heading text-display-sm sm:text-display text-white">
              Property Management Across Central Oregon
            </h1>
            <p className="mt-6 text-body-lg text-white/70">
              From the peaks of Bend to the high desert of Madras, we manage
              properties in six Central Oregon communities. Local expertise means
              better tenants, faster maintenance, and stronger returns.
            </p>
          </div>
        </div>
      </section>

      {/* City Cards Grid */}
      <section className="bg-neutral-light py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {areas.map((area) => {
              const image = getAreaImage(area)
              const firstParagraph = area.description?.[0]?.paragraph || ''

              return (
                <Link
                  key={area.slug}
                  href={`/market-areas/${area.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-xl bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99] motion-reduce:transform-none"
                >
                  {/* Image */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    {image && (
                      <Image
                        src={image}
                        alt={area.imageAlt || `${area.city}, Oregon`}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* City name overlay */}
                    <div className="absolute bottom-4 left-5">
                      <h2 className="font-heading text-subtitle text-white">
                        {area.city}
                      </h2>
                      {area.tagline && (
                        <p className="text-sm text-white/70 italic">{area.tagline}</p>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <p className="text-sm leading-relaxed text-neutral-mid line-clamp-3">
                      {firstParagraph}
                    </p>

                    {/* Quick stats */}
                    <div className="mt-4 flex items-center gap-4 border-t border-neutral-100 pt-4 text-xs text-neutral-mid">
                      {area.population && (
                        <span>
                          Pop.{' '}
                          <span className="font-semibold text-neutral-dark">
                            {area.population.toLocaleString()}
                          </span>
                        </span>
                      )}
                      {area.population && area.medianRent && (
                        <span className="text-neutral-300">|</span>
                      )}
                      {area.medianRent && (
                        <span>
                          Median Rent{' '}
                          <span className="font-semibold text-neutral-dark">
                            ${area.medianRent.toLocaleString()}/mo
                          </span>
                        </span>
                      )}
                    </div>

                    {/* Learn More link */}
                    <div className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-accent transition-colors group-hover:text-accent-dark">
                      Learn More
                      <svg aria-hidden="true"
                        className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom border accent on hover */}
                  <div className="absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-title text-white">
            Not sure which area is right for your investment?
          </h2>
          <p className="mt-4 text-body-lg text-white/70">
            Our team knows every Central Oregon market. Let us help you evaluate
            opportunities and maximize your rental income.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/owners" variant="primary" size="lg" elevated withArrow>
              Talk to Our Team
            </Button>
            <Button href="/listings" variant="glass" size="lg" withArrow>
              Browse All Listings
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
