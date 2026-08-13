import Link from 'next/link'
import Image from 'next/image'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import ContactForm from '@/components/forms/ContactForm'
import { getPageBySlug } from '@/lib/page-content'
import { AGENTS, telHref, smsHref } from '@/lib/agents'

export async function generateMetadata() {
  const page = await getPageBySlug('contact')
  return createMetadata({
    title: page?.meta?.title ?? page?.title ?? 'Contact Us',
    description:
      page?.meta?.description ??
      'Get in touch with High Desert Property Management. Contact our Redmond office for property management services in Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras.',
    path: '/contact',
  })
}

export default async function ContactPage() {
  const page = await getPageBySlug('contact')
  const c = page?.contactContent
  const breadcrumbs = breadcrumbSchema([
    { name: 'Home', url: '/' },
    { name: 'Contact', url: '/contact' },
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
              <li className="text-white">Contact</li>
            </ol>
          </nav>

          <h1 className="font-heading text-display-sm sm:text-display text-white">
            {c?.heroHeading ?? 'Get in Touch'}
          </h1>
          <p className="mt-4 max-w-2xl text-body-lg text-white/80">
            {c?.heroSubheading ?? "Have questions about our property management services? We'd love to hear from you. Fill out the form or reach us directly."}
          </p>
        </div>
      </section>

      {/* Form + Contact Info */}
      <section className="bg-neutral-light py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-5">
            {/* Contact Form — takes 3 of 5 columns */}
            <div className="lg:col-span-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
                <h2 className="font-heading text-heading text-neutral-dark">
                  Send Us a Message
                </h2>
                <p className="mt-2 text-sm text-neutral-mid">
                  Required fields are marked with an asterisk (<span className="text-red-500">*</span>).
                </p>
                <div className="mt-6">
                  <ContactForm />
                </div>
              </div>
            </div>

            {/* Contact Info Sidebar — takes 2 of 5 columns */}
            <div className="space-y-8 lg:col-span-2">
              {/* Office Info Card */}
              <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
                <h2 className="font-heading text-heading text-neutral-dark">
                  Our Office
                </h2>

                <div className="mt-6 space-y-5">
                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-dark">Address</p>
                      <p className="mt-0.5 text-sm text-neutral-mid">
                        {c?.officeAddress ?? '1515 SW Reindeer Ave\nRedmond, OR 97756'}
                      </p>
                    </div>
                  </div>

                  {/* Phone */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-dark">Phone</p>
                      <a
                        href={`tel:${(c?.officePhone ?? '(541) 548-0383').replace(/\D/g, '')}`}
                        className="mt-0.5 block text-sm text-accent transition-colors hover:text-accent-dark"
                      >
                        {c?.officePhone ?? '(541) 548-0383'}
                      </a>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-dark">Email</p>
                      <a
                        href={`mailto:${c?.officeEmail ?? 'info@highdesertpm.com'}`}
                        className="mt-0.5 block text-sm text-accent transition-colors hover:text-accent-dark"
                      >
                        {c?.officeEmail ?? 'info@highdesertpm.com'}
                      </a>
                    </div>
                  </div>

                  {/* Office Hours */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <svg aria-hidden="true" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-dark">Office Hours</p>
                      <p className="mt-0.5 text-sm text-neutral-mid">
                        {c?.officeHours ?? 'Monday \u2013 Friday\n9:00 AM \u2013 4:00 PM'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* After-Hours AI Support */}
              <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
                <h2 className="font-heading text-heading text-neutral-dark">
                  After Hours
                </h2>
                <p className="mt-2 text-sm text-neutral-mid">
                  When the office is closed or the team is on another call, our AI
                  agents are here to help:
                </p>

                <div className="mt-6 space-y-5">
                  {/* Leesa */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src="/agents/leesa.png"
                        alt="Leesa, AI leasing agent"
                        width={40}
                        height={40}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-dark">
                        Leesa &mdash; Leasing
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-mid">
                        Ask for Leesa for leasing questions — availability, applications,
                        and tours.
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <a
                          href={telHref(AGENTS.leesa.phone)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-dark"
                          aria-label={`Call Leesa at ${AGENTS.leesa.phone}`}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          Call
                        </a>
                        <a
                          href={smsHref(AGENTS.leesa.phone, AGENTS.leesa.smsGreeting)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:border-accent hover:bg-accent hover:text-white"
                          aria-label={`Text Leesa at ${AGENTS.leesa.phone}`}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                          Text
                        </a>
                        <span className="text-xs text-neutral-mid">{AGENTS.leesa.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Sally */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src="/agents/sally.png"
                        alt="Sally, AI general-questions agent"
                        width={40}
                        height={40}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-dark">
                        Sally &mdash; General Questions
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-mid">
                        Sally answers general questions anytime the office is unavailable.
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <a
                          href={telHref(AGENTS.sally.phone)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-dark"
                          aria-label={`Call Sally at ${AGENTS.sally.phone}`}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          Call
                        </a>
                        <a
                          href={smsHref(AGENTS.sally.phone, AGENTS.sally.smsGreeting)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:border-accent hover:bg-accent hover:text-white"
                          aria-label={`Text Sally at ${AGENTS.sally.phone}`}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                          Text
                        </a>
                        <span className="text-xs text-neutral-mid">{AGENTS.sally.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Max */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 overflow-hidden rounded-full">
                      <Image
                        src="/agents/max.png"
                        alt="Max, AI maintenance agent"
                        width={40}
                        height={40}
                        className="h-full w-full object-cover object-top"
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-neutral-dark">
                        Max &mdash; Maintenance{' '}
                        <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
                          24/7
                        </span>
                      </p>
                      <p className="mt-0.5 text-sm text-neutral-mid">
                        Max is available around the clock for maintenance requests and
                        emergencies.
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <a
                          href={telHref(AGENTS.max.phone)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-dark"
                          aria-label={`Call Max at ${AGENTS.max.phone}`}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                          </svg>
                          Call
                        </a>
                        <a
                          href={smsHref(AGENTS.max.phone, AGENTS.max.smsGreeting)}
                          className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:border-accent hover:bg-accent hover:text-white"
                          aria-label={`Text Max at ${AGENTS.max.phone}`}
                        >
                          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                          </svg>
                          Text
                        </a>
                        <span className="text-xs text-neutral-mid">{AGENTS.max.phone}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Office Map */}
              <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm">
                <iframe
                  title="High Desert Property Management office — 1515 SW Reindeer Ave, Redmond, OR"
                  src="https://www.google.com/maps?q=1515%20SW%20Reindeer%20Ave%2C%20Redmond%2C%20OR%2097756&output=embed"
                  className="block h-64 w-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
