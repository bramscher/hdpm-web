import Image from 'next/image'
import Link from 'next/link'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { MarketArea, Media } from '@/payload-types'
import Reveal from '@/components/ui/Reveal'
import Section from '@/components/ui/Section'

function getAreaImage(area: MarketArea): string {
  const heroImage = typeof area.heroImage === 'object' ? (area.heroImage as Media) : null
  return heroImage?.url || area.heroImageUrl || ''
}

export default async function MarketAreasSection() {
  const payload = await getPayload({ config })
  const { docs: areas } = await payload.find({
    collection: 'market-areas',
    where: { status: { equals: 'published' } },
    limit: 100,
    sort: '-population',
    depth: 1,
  })

  if (areas.length === 0) return null

  return (
    <Section tone="muted">
      {/* Section header */}
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-heading text-overline uppercase text-accent">
          Our Service Areas
        </p>
        <h2 className="mt-3 font-heading text-title text-neutral-dark">
          Managing Properties Across Central Oregon
        </h2>
        <p className="mt-4 text-body-lg text-neutral-mid">
          From Bend to Madras, we know every neighborhood and market. Local expertise
          means better tenants and stronger returns.
        </p>
      </Reveal>

      {/* City cards grid */}
      <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {areas.map((area, i) => {
          const image = getAreaImage(area)

          return (
            <Reveal key={area.slug} delay={Math.min(i, 3) * 0.07} className="h-full">
              <Link
                href={`/market-areas/${area.slug}`}
                className="group relative block h-full overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl active:scale-[0.99] motion-reduce:transform-none"
              >
                <div className="relative flex min-h-[220px] h-full flex-col justify-end">
                  {/* Background image */}
                  {image && (
                    <Image
                      src={image}
                      alt={area.imageAlt || `${area.city}, Oregon`}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}

                  {/* Gradient overlay - lighter, just enough for text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                  {/* Content */}
                  <div className="relative z-10 p-6">
                    <h3 className="font-heading text-2xl font-extrabold text-white">
                      {area.city}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-white/70">
                      Property Management
                    </p>
                    {area.tagline && (
                      <p className="mt-1 text-xs text-white/50 italic">
                        {area.tagline}
                      </p>
                    )}
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 -translate-x-2">
                    <div className="rounded-full bg-accent/80 p-2 backdrop-blur-sm">
                      <svg aria-hidden="true" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Bottom border accent on hover */}
                  <div className="absolute inset-x-0 bottom-0 h-1 scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
                </div>
              </Link>
            </Reveal>
          )
        })}
      </div>
    </Section>
  )
}
