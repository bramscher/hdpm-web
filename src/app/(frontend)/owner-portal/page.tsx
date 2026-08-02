import Link from 'next/link'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'

const OWNER_PORTAL_URL = 'https://highdesertpm.appfolio.com/oportal'

export const metadata = createMetadata({
  title: 'Owner Portal — Access Your Account Online',
  description:
    'Log in to the High Desert Property Management owner portal to view monthly statements, financial reports, maintenance invoices, and tax documents for your Central Oregon rental property.',
  path: '/owner-portal',
})

const portalFeatures = [
  {
    title: 'Monthly Statements',
    description:
      'View and download owner statements with income, expenses, and net distributions for each property.',
  },
  {
    title: 'Financial Reports',
    description:
      'Year-to-date performance, rent roll, and general ledger detail — available any time.',
  },
  {
    title: 'Maintenance & Invoices',
    description:
      'See completed work orders and the invoices behind every maintenance charge.',
  },
  {
    title: 'Tax Documents',
    description:
      'Download your 1099 and year-end statements when tax season comes around.',
  },
]

export default function OwnerPortalPage() {
  const jsonLd = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Owner Portal', url: '/owner-portal' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-primary px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Owner Portal
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Secure online access to your statements, reports, and documents —
            any time, from any device.
          </p>
          <div className="mt-8">
            <a
              href={OWNER_PORTAL_URL}
              className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
            >
              Log In to the Owner Portal
            </a>
          </div>
          <p className="mt-4 text-sm text-white/60">
            First time here? Your login invitation was sent to the email we
            have on file — or call us and we&apos;ll resend it.
          </p>
        </div>
      </section>

      {/* What you can do */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-heading text-2xl font-extrabold tracking-tight text-neutral-dark sm:text-3xl">
            What you can do in the portal
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {portalFeatures.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="font-heading text-lg font-bold text-neutral-dark">
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

      {/* Help + prospective owners */}
      <section className="bg-neutral-light py-16">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <h2 className="font-heading text-xl font-extrabold text-neutral-dark">
              Trouble logging in?
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-mid">
              Call our office at{' '}
              <a
                href="tel:+15415480383"
                className="font-semibold text-accent hover:underline"
              >
                (541) 548-0383
              </a>{' '}
              or email{' '}
              <a
                href="mailto:info@highdesertpm.com"
                className="font-semibold text-accent hover:underline"
              >
                info@highdesertpm.com
              </a>{' '}
              and we&apos;ll get you back into your account.
            </p>
          </div>
          <div>
            <h2 className="font-heading text-xl font-extrabold text-neutral-dark">
              Not a client yet?
            </h2>
            <p className="mt-3 leading-relaxed text-neutral-mid">
              See what professional management can do for your rental —{' '}
              <Link
                href="/owners"
                className="font-semibold text-accent hover:underline"
              >
                explore our services for owners
              </Link>{' '}
              or{' '}
              <Link
                href="/owners#get-started"
                className="font-semibold text-accent hover:underline"
              >
                request a free rental analysis
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  )
}
