import Image from 'next/image'
import Link from 'next/link'

const marketAreas = [
  {
    city: 'Bend',
    slug: 'bend',
    tagline: 'Oregon\'s outdoor playground',
    image: 'https://images.unsplash.com/photo-1575397283492-fde3e31e31f8?w=600&q=80',
    alt: 'Deschutes River flowing through downtown Bend, Oregon',
  },
  {
    city: 'Redmond',
    slug: 'redmond',
    tagline: 'The hub of Central Oregon',
    image: 'https://images.unsplash.com/photo-1542425967-a2dd69fefbb9?w=600&q=80',
    alt: 'Mountain views near Redmond, Oregon',
  },
  {
    city: 'Sisters',
    slug: 'sisters',
    tagline: 'Small-town mountain charm',
    image: 'https://images.unsplash.com/photo-1687388217723-251d0ea8fc55?w=600&q=80',
    alt: 'Three Sisters mountains near Sisters, Oregon',
  },
  {
    city: 'Prineville',
    slug: 'prineville',
    tagline: 'Where the desert meets the Ochocos',
    image: 'https://images.unsplash.com/photo-1693719205045-dc0f15254790?w=600&q=80',
    alt: 'Smith Rock State Park near Prineville, Oregon',
  },
  {
    city: 'La Pine',
    slug: 'la-pine',
    tagline: 'Ponderosa pine living',
    image: 'https://images.unsplash.com/photo-1687451223552-c7afa980bdad?w=600&q=80',
    alt: 'Mt. Bachelor reflected in a lake near La Pine, Oregon',
  },
  {
    city: 'Madras',
    slug: 'madras',
    tagline: 'Gateway to the high desert',
    image: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&q=80',
    alt: 'High desert landscape near Madras, Oregon',
  },
]

export default function MarketAreasSection() {
  return (
    <section className="bg-neutral-light py-24">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
        {/* Section header */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
            Our Service Areas
          </p>
          <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
            Managing Properties Across Central Oregon
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
            From Bend to Madras, we know every neighborhood and market. Local expertise
            means better tenants and stronger returns.
          </p>
        </div>

        {/* City cards grid */}
        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {marketAreas.map((area) => (
            <Link
              key={area.slug}
              href={`/market-areas/${area.slug}`}
              className="group relative overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className="relative min-h-[220px] flex flex-col justify-end">
                {/* Background image */}
                <Image
                  src={area.image}
                  alt={area.alt}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />

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
                  <p className="mt-1 text-xs text-white/50 italic">
                    {area.tagline}
                  </p>
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
          ))}
        </div>
      </div>
    </section>
  )
}
