import Link from 'next/link'
import Image from 'next/image'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema, faqSchema } from '@/lib/schema'
import { defaultFaqs } from './faq-data'
import { getPageBySlug } from '@/lib/page-content'
import type { Media as MediaType } from '@/payload-types'
import TenantFAQ from './TenantFAQ'

export async function generateMetadata() {
  const page = await getPageBySlug('tenants')
  return createMetadata({
    title: page?.meta?.title ?? page?.title ?? 'Tenants — Current & Prospective Renters',
    description:
      page?.meta?.description ??
      'Resources for current and prospective tenants of High Desert Property Management. Pay rent online, submit maintenance requests, browse available rentals, and learn about the application process.',
    path: '/tenants',
  })
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const defaultPortalCards = [
  {
    title: 'Pay Rent Online',
    description:
      'Make secure rent payments anytime through our online tenant portal. Set up auto-pay for hassle-free monthly payments.',
    href: 'https://highdesertpm.appfolio.com/connect/users/sign_in',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
    external: true,
  },
  {
    title: 'Submit Maintenance Request',
    description:
      'Report maintenance issues quickly through our online portal. Emergency requests are prioritized and responded to 24/7.',
    href: 'https://highdesertpm.appfolio.com/connect/users/sign_in',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.383a2.1 2.1 0 01-2.97-2.97l5.384-5.383m1.414-1.414l1.414-1.414a2.1 2.1 0 012.97 0l1.414 1.414a2.1 2.1 0 010 2.97l-1.414 1.414M7.5 10.5l4-4m2 8l4-4m-8.5 8.5l-1.5 1.5m6-14l1.5-1.5" />
      </svg>
    ),
    external: true,
  },
  {
    title: 'Tenant Resources',
    description:
      'Access lease information, move-in and move-out guides, community guidelines, and other helpful documents for your tenancy.',
    href: 'https://highdesertpm.appfolio.com/connect/users/sign_in',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    ),
    external: true,
  },
]

const defaultApplicationSteps = [
  {
    step: 1,
    title: 'Browse Listings',
    description:
      'Explore our available rental properties across Bend, Redmond, Sisters, and other Central Oregon communities.',
  },
  {
    step: 2,
    title: 'Submit Application',
    description:
      'Complete our online rental application with your personal information, rental history, and employment details.',
  },
  {
    step: 3,
    title: 'Background Check',
    description:
      'We run a thorough screening including credit check, criminal background, rental history verification, and employment confirmation.',
  },
  {
    step: 4,
    title: 'Move In',
    description:
      'Once approved, sign your lease, pay your deposit, and pick up your keys. Welcome to your new Central Oregon home!',
  },
]

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default async function TenantsPage() {
  const page = await getPageBySlug('tenants')
  const c = page?.tenantsContent

  /* Merge CMS portal cards with hardcoded icons */
  const portalCards = defaultPortalCards.map((card, i) => {
    const cms = c?.portalCards?.[i]
    return {
      ...card,
      title: cms?.title ?? card.title,
      description: cms?.description ?? card.description,
      href: cms?.href ?? card.href,
    }
  })

  /* Merge CMS application steps */
  const steps =
    c?.applicationSteps && c.applicationSteps.length > 0
      ? c.applicationSteps.map((s, i) => ({
          step: i + 1,
          title: s.title,
          description: s.description,
        }))
      : defaultApplicationSteps

  /* Hero image */
  const heroImageUrl =
    c?.heroImage && typeof c.heroImage === 'object' && (c.heroImage as MediaType).url
      ? (c.heroImage as MediaType).url!
      : 'https://images.unsplash.com/photo-1565846894054-51426d448b96?w=1920&q=80'

  const faqItems = c?.faqs?.length
    ? c.faqs.map((f) => ({ question: f.question, answer: f.answer }))
    : defaultFaqs

  const jsonLd = [
    breadcrumbSchema([
      { name: 'Home', url: '/' },
      { name: 'Tenants', url: '/tenants' },
    ]),
    faqSchema(faqItems),
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ==================== HERO ==================== */}
      <section className="relative flex min-h-[70vh] items-center overflow-hidden bg-primary">
        <Image
          src={heroImageUrl}
          alt="Deschutes River flowing through Central Oregon landscape"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 sm:px-8 lg:px-12">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium tracking-wide text-white/90 backdrop-blur-sm">
              <span className="inline-block h-2 w-2 rounded-full bg-accent-light animate-pulse" />
              For Tenants
            </div>

            <h1 className="font-heading text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
              {c?.heroHeading ?? <>Your Next Home in{' '}
              <span className="relative">
                Central Oregon
                <span className="absolute -bottom-1 left-0 h-1 w-full rounded-full bg-accent opacity-80" />
              </span></>}
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/80 sm:text-xl">
              {c?.heroSubheading ?? "Whether you're a current tenant or searching for your next rental, we're here to make your experience seamless. Access your portal, browse listings, or learn about our application process."}
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Link
                href="/listings"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg shadow-black/20 transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
              >
                Browse Available Rentals
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
                href="https://highdesertpm.appfolio.com/connect/users/sign_in"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 px-8 py-4 text-base font-semibold text-white border border-white/20 shadow-lg shadow-black/20 backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:shadow-xl hover:-translate-y-0.5"
              >
                Tenant Portal Login
                <svg aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== CURRENT TENANTS ==================== */}
      <section className="bg-neutral-light py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              Current Tenants
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Manage Your Tenancy Online
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
              Access everything you need through our secure online tenant portal.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {portalCards.map((portal) => (
              <a
                key={portal.title}
                href={portal.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative rounded-xl border border-gray-200 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-accent/20"
              >
                <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                  {portal.icon}
                </div>

                <h3 className="font-heading text-lg font-bold text-neutral-dark">
                  {portal.title}
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
                  {portal.description}
                </p>

                <div className="mt-5 flex items-center gap-1 text-sm font-semibold text-accent opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                  Open Portal
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                  </svg>
                </div>

                <div className="absolute inset-x-0 top-0 h-0.5 scale-x-0 rounded-t-xl bg-gradient-to-r from-accent to-accent-light transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== LOOKING FOR A RENTAL ==================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="flex flex-col items-center gap-12 lg:flex-row">
            <div className="flex w-full items-center justify-center lg:w-5/12">
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl bg-accent/10 text-accent sm:h-56 sm:w-56">
                <svg aria-hidden="true" className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>
              </div>
            </div>
            <div className="w-full lg:w-7/12">
              <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
                Find Your Home
              </p>
              <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
                Looking for a Rental?
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
                We manage quality rental homes across Bend, Redmond, Sisters,
                Prineville, Culver, Metolius, and Madras. Browse our current available
                listings to find your next Central Oregon home.
              </p>
              <div className="mt-4 space-y-3">
                {[
                  'Well-maintained homes across Central Oregon',
                  'Responsive property management team',
                  'Easy online application process',
                  'Secure online rent payments and maintenance requests',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-neutral-dark">
                    <svg aria-hidden="true"
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {item}
                  </div>
                ))}
              </div>
              <Link
                href="/listings"
                className="group mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
              >
                View Available Listings
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
            </div>
          </div>
        </div>
      </section>

      {/* ==================== APPLICATION PROCESS ==================== */}
      <section className="bg-neutral-light py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              How It Works
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Application Process
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
              Getting into your new Central Oregon home is simple. Here&apos;s
              how it works.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((item) => (
              <div key={item.step} className="relative text-center">
                {/* Step number */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent text-2xl font-extrabold text-white font-heading shadow-lg shadow-accent/20">
                  {item.step}
                </div>

                {/* Connector line (hidden on last item and mobile) */}
                {item.step < steps.length && (
                  <div className="absolute left-[calc(50%+2rem)] top-8 hidden h-0.5 w-[calc(100%-4rem)] bg-accent/20 lg:block" />
                )}

                <h3 className="mt-6 font-heading text-lg font-bold text-neutral-dark">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================== TENANT FAQ ==================== */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              FAQ
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
              Answers to common questions from current and prospective tenants.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-3xl">
            <TenantFAQ faqs={c?.faqs?.map(f => ({ question: f.question, answer: f.answer }))} />
          </div>
        </div>
      </section>

      {/* ==================== CTA ==================== */}
      <section className="relative overflow-hidden py-24">
        <Image
          src="https://images.unsplash.com/photo-1718927445954-b050d18bc135?w=1920&q=80"
          alt="Three Sisters mountain range in Central Oregon"
          fill
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute -right-32 -top-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center sm:px-8">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            {c?.ctaHeading ?? 'Ready to Find Your Home?'}
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
            {c?.ctaBody ?? 'Browse our available rental listings or contact us to learn more about living in Central Oregon. Our team is here to help you every step of the way.'}
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/listings"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
              Browse Listings
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
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/20 px-8 py-4 text-base font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Call (541) 548-0383
            </a>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/60">
            <a href="mailto:info@highdesertpm.com" className="flex items-center gap-2 transition-colors hover:text-white">
              <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              info@highdesertpm.com
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
