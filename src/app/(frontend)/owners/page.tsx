import ScrollHero from '@/components/ui/ScrollHero'
import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema, localBusinessSchema } from '@/lib/schema'
import { getPageBySlug } from '@/lib/page-content'
import type { Media as MediaType, Testimonial } from '@/payload-types'
import Button from '@/components/ui/Button'
import OwnerRentalAnalysisForm from '@/components/forms/OwnerRentalAnalysisForm'

// Rendered on demand: this page reads CMS content from Payload/Postgres, and
// the build must not depend on the database being reachable and migrated
// (Preview deployments connect to a DB without the Payload schema).
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const page = await getPageBySlug('owners')
  return createMetadata({
    // The root layout applies a `%s | High Desert Property Management` title
    // template, so this fallback must NOT include the brand suffix itself.
    title:
      page?.meta?.title ??
      page?.title ??
      'Property Management for Owners in Central Oregon',
    description:
      page?.meta?.description ??
      'Full-service property management for rental owners and investors in Bend, Redmond, Sisters, and Central Oregon. Leasing, tenant screening, maintenance, rent collection, and owner reporting. Get a free rental analysis.',
    path: '/owners',
  })
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const defaultWhyItems = [
  {
    title: 'Local Expertise',
    description:
      'We live and work in Central Oregon. Our deep knowledge of the Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras markets means accurate pricing and faster placements.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    ),
  },
  {
    title: 'Transparent Pricing',
    description:
      'No hidden fees, no surprise charges. Our competitive management fees are clearly outlined so you know exactly what to expect from day one.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    title: 'Technology-Driven',
    description:
      'Real-time owner portals, online rent collection, digital lease signing, and automated reporting. Modern tools that keep you informed and your tenants happy.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25A2.25 2.25 0 015.25 3h13.5A2.25 2.25 0 0121 5.25z" />
      </svg>
    ),
  },
]

const defaultServices = [
  {
    id: 'full-service',
    title: 'Full-Service Property Management',
    description:
      'Let us handle every aspect of your rental property so you can enjoy true passive income. From the moment a tenant signs the lease to the day they move out, we manage it all.',
    features: [
      'Comprehensive tenant screening with credit, criminal, and rental history checks',
      'Lease preparation, execution, and enforcement',
      'Monthly rent collection with direct-deposit owner disbursements',
      'Regular property inspections and condition reports',
      'Lease renewal negotiations to minimize turnover',
    ],
    image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
    imageAlt: 'Modern residential home in the Pacific Northwest with mountain views',
  },
  {
    id: 'tenant-placement',
    title: 'Tenant Placement',
    description:
      'Finding the right tenant is the single most important factor in protecting your investment. Our proven process fills vacancies fast with qualified, reliable renters.',
    features: [
      'Professional photography and compelling listing descriptions',
      'Syndication across 30+ rental platforms including Zillow, Apartments.com, and more',
      'Coordinated showings and open houses',
      'Thorough background checks including employment and income verification',
      'Lease signing and move-in coordination',
    ],
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
    imageAlt: 'Keys being handed over during a rental property showing',
  },
  {
    id: 'maintenance',
    title: 'Maintenance Coordination',
    description:
      'Protect your property value with responsive, cost-effective maintenance. Our vetted network of Central Oregon contractors ensures quality work at fair prices.',
    features: [
      '24/7 emergency maintenance hotline for tenants',
      'Trusted network of licensed, insured local contractors',
      'Preventive maintenance programs to avoid costly repairs',
      'Owner approval on non-emergency repairs above set thresholds',
      'Detailed documentation and photos for every work order',
    ],
    image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
    imageAlt: 'Professional maintenance technician performing property repairs',
  },
  {
    id: 'reporting',
    title: 'Financial Reporting',
    description:
      'Full visibility into your investment performance. Our detailed reporting keeps you informed and makes tax time a breeze.',
    features: [
      'Monthly owner statements with income and expense breakdowns',
      'Year-end tax-ready financial packages (1099s included)',
      'Real-time online owner portal with 24/7 access',
      'Customizable reporting for multi-property portfolios',
      'Direct deposit of owner proceeds on a consistent schedule',
    ],
    image: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
    imageAlt: 'Financial documents and reporting dashboard for property owners',
  },
]


/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg aria-hidden="true"
          key={i}
          className={`h-5 w-5 ${i < rating ? 'text-accent' : 'text-neutral-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
        </svg>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function OwnersPage() {
  const page = await getPageBySlug('owners')
  const c = page?.ownersContent

  const whyHdpm = defaultWhyItems.map((item, i) => ({
    ...item,
    title: c?.whyItems?.[i]?.title ?? item.title,
    description: c?.whyItems?.[i]?.description ?? item.description,
  }))

  const services = c?.services?.length
    ? c.services.map((s, i) => {
        const fallback = defaultServices[i]
        const img =
          s.image && typeof s.image === 'object' && (s.image as MediaType).url
            ? (s.image as MediaType).url!
            : s.imageUrl ?? fallback?.image ?? ''
        return {
          id: fallback?.id ?? `service-${i}`,
          title: s.title,
          description: s.description,
          features: s.features?.map((f) => f.text) ?? fallback?.features ?? [],
          image: img,
          imageAlt: s.imageAlt ?? fallback?.imageAlt ?? '',
        }
      })
    : defaultServices

  const pricingItems = c?.pricingItems?.length
    ? c.pricingItems.map((p) => ({ label: p.label, note: p.note }))
    : [
        { label: 'Full-Service Management', note: 'Percentage of monthly rent collected' },
        { label: 'Tenant Placement', note: 'One-time fee per placement' },
        { label: 'Lease Renewal', note: 'Flat fee per renewal' },
        { label: 'Maintenance Coordination', note: 'Included with full-service' },
      ]

  // Guarded so the page still renders (without testimonials) when the
  // database is unavailable — e.g. a Preview deployment on an unmigrated DB.
  let ownerTestimonials: Testimonial[] = []
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'testimonials',
      where: { approved: { equals: true }, rating: { equals: 5 } },
      sort: '-publishedAt',
      limit: 3,
      depth: 0,
    })
    ownerTestimonials = res.docs
  } catch {
    ownerTestimonials = []
  }

  const jsonLd = [
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Property Owners', url: '/owners' },
    ]),
    localBusinessSchema(),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ==================== HERO ==================== */}
      <ScrollHero className="relative flex min-h-[70vh] items-center overflow-hidden bg-primary">
        <Image
          src={
            c?.heroImage && typeof c.heroImage === 'object' && (c.heroImage as MediaType).url
              ? (c.heroImage as MediaType).url!
              : 'https://images.unsplash.com/photo-1687451225150-e25d21b013cc?w=1920&q=80'
          }
          alt="Central Oregon landscape with mountains and high desert terrain"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide text-white/90 backdrop-blur-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-accent-light animate-pulse" />
              For Property Owners
            </div>

            <h1 className="font-heading text-display-sm sm:text-display lg:text-display-xl text-white">
              {c?.heroHeading ?? 'Property Management for Central Oregon Owners'}
            </h1>

            <p className="mt-6 max-w-2xl text-body-lg text-white/80">
              {c?.heroSubheading ??
                "Maximize your rental income and protect your investment with Central Oregon\u2019s most trusted property management team. We deliver peace of mind so you can enjoy the lifestyle you moved here for."}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                href={c?.heroCTA1Link ?? '#get-started'}
                variant="primary"
                size="lg"
                elevated
                withArrow
              >
                {c?.heroCTA1Label ?? 'Get a Free Rental Analysis'}
              </Button>
              <Button href="tel:5415480383" variant="glass" size="lg">
                <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                (541) 548-0383
              </Button>
            </div>

            <p className="mt-8 text-sm text-white/70">
              Already a client?{' '}
              <Link
                href="/owner-portal"
                className="font-semibold text-accent-light underline-offset-2 hover:underline"
              >
                Owner Login &rarr;
              </Link>
            </p>
          </div>
        </div>
      </ScrollHero>

      {/* ==================== WHY HDPM ==================== */}
      <section className="bg-neutral-light py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              Why HDPM
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              The Central Oregon Advantage
            </h2>
            <p className="mt-4 text-body-lg text-neutral-mid">
              We combine local market knowledge with modern technology to deliver
              results that out-of-area firms simply can&apos;t match.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {whyHdpm.map((item) => (
              <div
                key={item.title}
                className="group relative rounded-xl border border-neutral-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/20 active:scale-[0.99] motion-reduce:transform-none"
              >
                <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                  {item.icon}
                </div>
                <h3 className="font-heading text-heading text-neutral-dark">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
                  {item.description}
                </p>
                <div className="absolute inset-x-0 top-0 h-0.5 scale-x-0 rounded-t-xl bg-gradient-to-r from-accent to-accent-light transition-transform duration-300 group-hover:scale-x-100" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== SERVICES DETAIL ==================== */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              Our Services
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Everything Your Property Needs
            </h2>
            <p className="mt-4 text-body-lg text-neutral-mid">
              Comprehensive property management services tailored to Central
              Oregon&apos;s unique rental market.
            </p>
          </div>

          <div className="mt-20 space-y-24">
            {services.map((service, i) => (
              <div
                key={service.id}
                id={service.id}
                className={`flex flex-col items-center gap-12 lg:flex-row ${
                  i % 2 === 1 ? 'lg:flex-row-reverse' : ''
                }`}
              >
                {/* Image side */}
                <div className="w-full lg:w-5/12">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-xl shadow-lg">
                    <Image
                      src={service.image}
                      alt={service.imageAlt}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 40vw"
                    />
                  </div>
                </div>

                {/* Content side */}
                <div className="w-full lg:w-7/12">
                  <h3 className="font-heading text-subtitle text-neutral-dark">
                    {service.title}
                  </h3>
                  <p className="mt-4 text-base leading-relaxed text-neutral-mid">
                    {service.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {service.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm text-neutral-dark">
                        <svg aria-hidden="true"
                          className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== PRICING ==================== */}
      <section className="bg-neutral-light py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              Pricing
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Competitive, Transparent Pricing
            </h2>
            <p className="mt-4 text-body-lg text-neutral-mid">
              Every property is unique, so we customize our management plans to
              fit your goals and property type. No hidden fees, no long-term
              contracts required.
            </p>
          </div>

          <div className="mx-auto mt-12 max-w-2xl rounded-xl border border-neutral-200 bg-white p-8 shadow-sm sm:p-12">
            <div className="grid gap-6 sm:grid-cols-2">
              {pricingItems.map((item) => (
                <div key={item.label} className="rounded-lg bg-neutral-light p-5">
                  <p className="font-heading text-sm font-bold text-neutral-dark">{item.label}</p>
                  <p className="mt-1 text-xs text-neutral-mid">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 border-t border-neutral-200 pt-8 text-center">
              <p className="text-sm text-neutral-mid">
                Contact us for a personalized quote based on your property type,
                location, and management needs.
              </p>
              <Button
                href="#get-started"
                variant="primary"
                size="lg"
                elevated
                withArrow
                className="mt-6"
              >
                Schedule a Consultation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== TESTIMONIALS ==================== */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              Testimonials
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Trusted by Central Oregon Owners
            </h2>
            <p className="mt-4 text-body-lg text-neutral-mid">
              Hear from property owners who trust us to protect their investments.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {ownerTestimonials.map((testimonial) => (
              <div
                key={testimonial.id}
                className="relative rounded-xl border border-neutral-200 bg-neutral-light p-8 shadow-sm"
              >
                <div className="absolute -top-3 left-6">
                  <span className="inline-block rounded-lg bg-accent px-3 py-1 font-heading text-2xl font-bold leading-none text-white">
                    &ldquo;
                  </span>
                </div>

                <StarRating rating={testimonial.rating} />

                <blockquote className="mt-4 text-sm leading-relaxed text-neutral-dark">
                  {testimonial.text}
                </blockquote>

                <div className="mt-6 border-t border-neutral-200 pt-4">
                  <p className="font-heading text-sm font-bold text-neutral-dark">
                    {testimonial.author}
                  </p>
                  {testimonial.publishedAt && (
                    <p className="text-xs text-neutral-mid">
                      {new Date(testimonial.publishedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== AREAS WE SERVE ==================== */}
      <section className="border-t border-neutral-100 bg-neutral-light py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              Areas We Serve
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Local Property Management Across Central Oregon
            </h2>
            <p className="mt-4 text-body-lg text-neutral-mid">
              We manage rentals for owners throughout the region. Explore the
              market you own in:
            </p>
          </div>

          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-3">
            {[
              { slug: 'bend', city: 'Bend' },
              { slug: 'redmond', city: 'Redmond' },
              { slug: 'sisters', city: 'Sisters' },
              { slug: 'prineville', city: 'Prineville' },
              { slug: 'madras', city: 'Madras' },
              { slug: 'culver', city: 'Culver' },
            ].map((area) => (
              <Link
                key={area.slug}
                href={`/market-areas/${area.slug}`}
                className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-dark shadow-sm transition-colors hover:border-accent hover:bg-accent/5 hover:text-accent"
              >
                {area.city} property management
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== GET STARTED CTA ==================== */}
      <section id="get-started" className="relative overflow-hidden py-24">
        <Image
          src="https://images.unsplash.com/photo-1687451223552-c7afa980bdad?w=1920&q=80"
          alt="Mt. Bachelor reflected in a Central Oregon lake"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-title sm:text-display text-white">
            {c?.ctaHeading ?? 'Get Your Free Rental Analysis'}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-white/80">
            {c?.ctaBody ??
              'Find out how much your Central Oregon property could earn with professional management. Our free, no-obligation analysis includes a market rent estimate, property assessment, and customized management plan.'}
          </p>

          <div className="mx-auto mt-10 max-w-2xl rounded-xl bg-white p-6 text-left shadow-xl sm:p-8">
            <OwnerRentalAnalysisForm />
          </div>

          <p className="mt-6 text-sm text-white/70">
            Prefer to talk?{' '}
            <a href="tel:5415480383" className="font-semibold text-white underline underline-offset-2 hover:text-accent-light">
              Call (541) 548-0383
            </a>
          </p>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-accent-light" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
              </svg>
              No Obligation
            </div>
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-accent-light" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
              </svg>
              Response Within 24 Hours
            </div>
            <div className="flex items-center gap-2">
              <svg aria-hidden="true" className="h-5 w-5 text-accent-light" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
              </svg>
              Custom Management Plan
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
