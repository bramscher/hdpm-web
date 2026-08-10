import Link from 'next/link'
import Image from 'next/image'
import { getPayload } from 'payload'
import Button from '@/components/ui/Button'
import config from '@payload-config'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { getPageBySlug } from '@/lib/page-content'
import { FOUNDED_YEAR, SERVING_SINCE } from '@/lib/constants'
import type { Media as MediaType, TeamMember } from '@/payload-types'

// Rendered on demand: this page reads CMS content from Payload/Postgres, and
// the build must not depend on the database being reachable and migrated
// (Preview deployments connect to a DB without the Payload schema).
export const dynamic = 'force-dynamic'

export async function generateMetadata() {
  const page = await getPageBySlug('about')
  return createMetadata({
    title: page?.meta?.title ?? page?.title ?? 'About Us',
    description:
      page?.meta?.description ??
      `Learn about High Desert Property Management — serving Central Oregon property owners since ${FOUNDED_YEAR}. Local expertise in Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras.`,
    path: '/about',
  })
}

const defaultValues = [
  {
    title: 'Integrity',
    description:
      'We believe in transparent communication, honest reporting, and doing the right thing — even when no one is watching. Your trust is the foundation of everything we do.',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819"
        />
      </svg>
    ),
  },
]

const defaultIcon = (
  <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
  </svg>
)

const serviceAreas = ['Bend', 'Redmond', 'Sisters', 'Prineville', 'Culver', 'Metolius', 'Madras']

const aiAgents = [
  {
    name: 'Leesa',
    role: 'Leasing',
    image: '/agents/leesa.png',
    availability: 'After hours',
    description:
      'Ask for Leesa for anything leasing — current availability, application questions, and scheduling tours — whenever our leasing team is away.',
  },
  {
    name: 'Sally',
    role: 'General Questions',
    image: '/agents/sally.png',
    availability: 'After hours',
    description:
      'Sally is a friendly first stop for general questions about our services, your account, and how we work — perfect for when the office is closed or everyone is on another call.',
  },
  {
    name: 'Max',
    role: 'Maintenance',
    image: '/agents/max.png',
    availability: '24/7',
    description:
      'Max is here around the clock for maintenance requests and emergencies, so urgent issues never have to wait until morning.',
  },
]

export default async function AboutPage() {
  const page = await getPageBySlug('about')
  const c = page?.aboutContent

  // Guarded so the page still renders (without the team grid) when the
  // database is unavailable — e.g. a Preview deployment on an unmigrated DB.
  let teamMembers: TeamMember[] = []
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'team-members',
      sort: 'order',
      limit: 20,
    })
    teamMembers = res.docs
  } catch {
    teamMembers = []
  }
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
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </li>
              <li className="text-white">About</li>
            </ol>
          </nav>

          <h1 className="font-heading text-display-sm sm:text-display text-white">
            {c?.heroHeading ?? 'About High Desert Property Management'}
          </h1>
          <p className="mt-4 max-w-2xl text-body-lg text-white/80">
            {c?.heroSubheading ?? 'Trusted by Central Oregon property owners for over a decade.'}
          </p>
        </div>
      </section>

      {/* Company Story */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <p className="font-heading text-overline uppercase text-accent">
              {c?.storyLabel ?? 'Our Story'}
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              {c?.storyHeading ?? SERVING_SINCE}
            </h2>
            <div className="mt-8 space-y-6 text-body-lg text-neutral-mid">
              {c?.storyParagraphs && c.storyParagraphs.length > 0 ? (
                c.storyParagraphs.map((para, i) => <p key={i}>{para.text}</p>)
              ) : (
                <>
                  <p>
                    High Desert Property Management operates with a simple mission: to provide
                    Central Oregon property owners with professional, reliable management they can
                    trust. Over the years, we&apos;ve grown into one of the region&apos;s most
                    respected property management companies.
                  </p>
                  <p>
                    Over the years, we&apos;ve built our reputation on honest communication,
                    meticulous attention to detail, and a genuine commitment to protecting our
                    clients&apos; investments. Today, we manage hundreds of properties across Bend,
                    Redmond, Sisters, Prineville, Culver, Metolius, and Madras — from single-family homes to
                    multi-unit complexes.
                  </p>
                  <p>
                    Our team lives and works in Central Oregon. We understand the unique dynamics of
                    this market — from seasonal rental trends to the nuances of each community. That
                    local knowledge, combined with proven systems and technology, allows us to deliver
                    results that out-of-area management companies simply can&apos;t match.
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-light py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              What Drives Us
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Our Core Values
            </h2>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {(c?.values && c.values.length > 0
              ? c.values.map((v, i) => ({
                  title: v.title,
                  description: v.description,
                  icon: defaultValues[i]?.icon ?? defaultIcon,
                }))
              : defaultValues
            ).map((value) => (
              <div
                key={value.title}
                className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm"
              >
                <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3 text-accent">
                  {value.icon}
                </div>
                <h3 className="font-heading text-heading text-neutral-dark">
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
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              Where We Work
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Our Service Area
            </h2>
            <p className="mt-6 text-body-lg text-neutral-mid">
              We proudly serve property owners and tenants across seven Central Oregon
              communities. Each market has its own character, and we bring specialized
              knowledge to every one.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              {serviceAreas.map((area) => (
                <Link
                  key={area}
                  href={`/market-areas/${area.toLowerCase()}`}
                  className="rounded-full border border-accent/20 bg-accent/5 px-5 py-2 text-sm font-semibold text-accent transition-colors hover:border-accent hover:bg-accent hover:text-white"
                >
                  {area}, OR
                </Link>
              ))}
            </div>

            <div className="mt-10">
              <Link
                href="/market-areas"
                className="group inline-flex items-center gap-2 text-base font-semibold text-accent transition-colors hover:text-accent-dark"
              >
                Explore Our Market Areas
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

      {/* Team */}
      <section className="bg-neutral-light py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              The People Behind HDPM
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Meet Our Team
            </h2>
            <p className="mt-4 text-body-lg text-neutral-mid">
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
                  className="rounded-xl border border-neutral-200 bg-white p-6 text-center shadow-sm"
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
                      <svg aria-hidden="true" className="h-14 w-14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                        />
                      </svg>
                    </div>
                  )}
                  <h3 className="mt-4 font-heading text-heading text-neutral-dark">
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

      {/* AI Agents */}
      <section className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="font-heading text-overline uppercase text-accent">
              Always Here to Help
            </p>
            <h2 className="mt-3 font-heading text-title text-neutral-dark">
              Meet Our AI Agents
            </h2>
            <p className="mt-4 text-body-lg text-neutral-mid">
              When the office is closed or our team is tied up on another call, our AI
              agents step in — so you always get answers, day or night.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {aiAgents.map((agent) => (
              <div
                key={agent.name}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                  <Image
                    src={agent.image}
                    alt={`${agent.name}, High Desert Property Management's AI ${agent.role.toLowerCase()} agent`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover object-top transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-neutral-dark/70 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur-sm">
                    AI Agent
                  </span>
                  <span
                    className={`absolute right-4 top-4 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow ${
                      agent.availability === '24/7'
                        ? 'bg-accent'
                        : 'bg-primary/80 backdrop-blur-sm'
                    }`}
                  >
                    {agent.availability}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h3 className="font-heading text-heading text-neutral-dark">
                    {agent.name}
                  </h3>
                  <p className="text-sm font-semibold text-accent">{agent.role}</p>
                  <p className="mt-3 flex-1 text-sm leading-relaxed text-neutral-mid">
                    {agent.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-neutral-mid">
            After office hours, ask for{' '}
            <span className="font-semibold text-neutral-dark">Leesa</span> for leasing,{' '}
            <span className="font-semibold text-neutral-dark">Sally</span> for general
            questions, and{' '}
            <span className="font-semibold text-neutral-dark">Max</span> anytime —
            he&rsquo;s available 24/7 for maintenance.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="font-heading text-title text-white">
            Ready to Work With Us?
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-body-lg text-white/80">
            Whether you own one property or twenty, we&apos;d love to show you what
            professional management looks like. Get in touch for a free consultation.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href="/contact" variant="primary" size="lg" elevated withArrow>
              Contact Us
            </Button>
            <Button href="/owners" variant="glass" size="lg" withArrow>
              Owner Services
            </Button>
          </div>
        </div>
      </section>
    </>
  )
}
