import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import config from '@payload-config'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import type { Media as MediaType } from '@/payload-types'

export const metadata = createMetadata({
  title: 'About Us',
  description:
    'Learn about High Desert Property Management — serving Central Oregon property owners since 2011. Local expertise in Bend, Redmond, Sisters, Prineville, La Pine, and Madras.',
  path: '/about',
})

const values = [
  {
    title: 'Integrity',
    description:
      'We believe in transparent communication, honest reporting, and doing the right thing — even when no one is watching. Your trust is the foundation of everything we do.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
  },
  {
    title: 'Local Expertise',
    description:
      'We live and work in Central Oregon. Our deep knowledge of local rental markets, seasonal trends, and community nuances gives your property a competitive edge.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
    ),
  },
  {
    title: 'Owner-First Approach',
    description:
      'Your investment goals drive every decision we make. From maximizing rental income to minimizing vacancy, we treat your property as if it were our own.',
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
        />
      </svg>
    ),
  },
]

const serviceAreas = ['Bend', 'Redmond', 'Sisters', 'Prineville', 'La Pine', 'Madras']

export default async function AboutPage() {
  const payload = await getPayload({ config })
  const { docs: teamMembers } = await payload.find({
    collection: 'team-members',
    sort: 'order',
    limit: 20,
  })
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'About', url: '/about' },
  ])

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbs) }}
      />

      {/* Hero */}
      <section className="bg-primary px-4 pb-16 pt-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <nav aria-label="Breadcrumb" className="mb-6">
            <ol className="flex items-center gap-2 text-sm text-white/70">
              <li>
                <Link href="/" className="transition-colors hover:text-white">
                  Home
                </Link>
              </li>
              <li aria-hidden="true">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-white">About</li>
            </ol>
          </nav>

          <h1 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            About High Desert Property Management
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/80">
            Trusted by Central Oregon property owners for over a decade.
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              Our Story
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Serving Central Oregon Since 2011
            </h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-neutral-mid">
              <p>
                High Desert Property Management was founded with a simple mission: to provide
                Central Oregon property owners with professional, reliable management they can
                trust. What started as a small operation has grown into one of the region&apos;s
                most respected property management companies.
              </p>
              <p>
                Over the years, we&apos;ve built our reputation on honest communication,
                meticulous attention to detail, and a genuine commitment to protecting our
                clients&apos; investments. Today, we manage hundreds of properties across Bend,
                Redmond, Sisters, Prineville, La Pine, and Madras — from single-family homes to
                multi-unit complexes.
              </p>
              <p>
                Our team lives and works in Central Oregon. We understand the unique dynamics of
                this market — from seasonal rental trends to the nuances of each community. That
                local knowledge, combined with proven systems and technology, allows us to deliver
                results that out-of-area management companies simply can&apos;t match.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-light py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              What Drives Us
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Our Core Values
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3 text-accent">
                  {value.icon}
                </div>
                <h3 className="font-heading text-lg font-bold text-neutral-dark">
                  {value.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Area */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              Where We Work
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Our Service Area
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-neutral-mid">
              We proudly serve property owners and tenants across six Central Oregon
              communities. Each market has its own character, and we bring specialized
              knowledge to every one.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {serviceAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full border border-accent/20 bg-accent/5 px-5 py-2 text-sm font-semibold text-accent"
                >
                  {area}, OR
                </span>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/market-areas"
                className="group inline-flex items-center gap-2 text-base font-semibold text-accent transition-colors hover:text-accent-dark"
              >
                Explore Our Market Areas
                <svg
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

      {/* Team */}
      <section className="bg-neutral-light py-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-sm font-bold uppercase tracking-widest text-accent">
              The People Behind HDPM
            </p>
            <h2 className="mt-3 font-heading text-3xl font-extrabold tracking-tight text-neutral-dark sm:text-4xl">
              Meet Our Team
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
              Our experienced team is dedicated to making property ownership simple and
              stress-free.
            </p>
          </div>

          <div className={`mt-16 grid gap-8 sm:grid-cols-2 ${teamMembers.length >= 4 ? 'lg:grid-cols-4' : teamMembers.length === 3 ? 'lg:grid-cols-3' : ''}`}>
            {teamMembers.map((member) => {
              const photo = member.photo as MediaType | null | undefined
              return (
                <div
                  key={member.id}
                  className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm"
                >
                  {photo?.url ? (
                    <div className="mx-auto h-28 w-28 overflow-hidden rounded-full">
                      <Image
                        src={photo.url}
                        alt={member.name}
                        width={112}
                        height={112}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-accent/10 text-accent">
                      <svg className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    </div>
                  )}
                  <h3 className="mt-4 font-heading text-lg font-bold text-neutral-dark">
                    {member.name}
                  </h3>
                  <p className="text-sm font-medium text-accent">{member.title}</p>
                  {member.bio && (
                    <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
                      {member.bio}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          {teamMembers.length === 0 && (
            <p className="mt-8 text-center text-sm text-neutral-mid">
              Team profiles coming soon.
            </p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-20">
        <div className="mx-auto max-w-4xl px-6 text-center sm:px-8">
          <h2 className="font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to Work With Us?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80">
            Whether you own one property or twenty, we&apos;d love to show you what
            professional management looks like. Get in touch for a free consultation.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/contact"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
            >
              Contact Us
              <svg
                className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              href="/owners"
              className="group inline-flex items-center justify-center gap-2 rounded-lg bg-white/10 border border-white/20 px-8 py-4 text-base font-semibold text-white shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white/20 hover:shadow-xl hover:-translate-y-0.5"
            >
              Owner Services
              <svg
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
      </section>
    </>
  )
}
