import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getPayload } from 'payload'
import config from '@payload-config'
import LeadForm from '@/components/forms/LeadForm'
import CampaignTracker from '@/components/CampaignTracker'
import type { LandingPage, Media, Testimonial } from '@/payload-types'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

async function getLandingPage(slug: string): Promise<LandingPage | null> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'landing-pages',
    where: { slug: { equals: slug }, status: { equals: 'published' } },
    depth: 2,
    limit: 1,
  })
  return docs[0] ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const page = await getLandingPage(slug)
  return {
    title: page?.headline ?? 'High Desert Property Management',
    robots: { index: false, follow: false },
  }
}

export default async function LandingPageRoute({ params, searchParams }: PageProps) {
  const { slug } = await params
  const search = await searchParams
  const page = await getLandingPage(slug)
  if (!page) notFound()

  const rawCampaign = typeof search.utm_campaign === 'string' ? search.utm_campaign : ''
  const campaign = rawCampaign.replace(/[^a-z0-9-]/gi, '').slice(0, 80)

  const hero = (page.heroImage as Media | null) ?? null
  const testimonial = (page.testimonial as Testimonial | null) ?? null

  const sourceDetail = campaign ? `Ad campaign: ${campaign}` : `Ad landing: ${slug}`

  return (
    <>
      <CampaignTracker campaign={campaign} />

      {/* Minimal top bar — no nav links, keep visitors on the page */}
      <header className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <span className="font-heading text-lg font-bold text-neutral-dark">
            High Desert Property Management
          </span>
          <a
            href="tel:+15415480383"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            (541) 548-0383
          </a>
        </div>
      </header>

      <section className="bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:py-16">
          {/* Left: message */}
          <div>
            <h1 className="font-heading text-3xl font-extrabold leading-tight text-neutral-dark sm:text-4xl">
              {page.headline}
            </h1>
            {page.subheadline && (
              <p className="mt-4 text-lg leading-relaxed text-gray-600">{page.subheadline}</p>
            )}

            {(page.bullets?.length ?? 0) > 0 && (
              <ul className="mt-8 space-y-3">
                {page.bullets!.map((b, i) => (
                  <li key={b.id ?? i} className="flex items-start gap-3">
                    <svg
                      className="mt-0.5 h-6 w-6 flex-shrink-0 text-accent"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-base text-neutral-dark">{b.text}</span>
                  </li>
                ))}
              </ul>
            )}

            {hero?.url && (
              <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-2xl shadow-md">
                <Image
                  src={hero.url}
                  alt={hero.alt || page.headline}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
              </div>
            )}
          </div>

          {/* Right: form */}
          <div>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-lg sm:p-8">
              <LeadForm
                sourceDetail={sourceDetail}
                analyticsTag={`lp_${slug}`}
                heading={page.formHeading || 'Get Your Free Rental Analysis'}
                subheading={page.formSubheading || undefined}
              />
            </div>

            {testimonial && (
              <figure className="mt-6 rounded-2xl bg-gray-50 p-6">
                <div className="flex gap-1 text-amber-400" aria-hidden>
                  {Array.from({ length: testimonial.rating ?? 5 }).map((_, i) => (
                    <svg key={i} className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.367 2.446a1 1 0 00-.363 1.118l1.286 3.958c.3.922-.755 1.688-1.539 1.118l-3.367-2.446a1 1 0 00-1.175 0l-3.367 2.446c-.783.57-1.838-.196-1.538-1.118l1.285-3.958a1 1 0 00-.363-1.118L2.98 9.385c-.783-.57-.38-1.81.588-1.81h4.162a1 1 0 00.951-.69l1.286-3.958z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="mt-3 text-sm leading-relaxed text-gray-700">
                  “{testimonial.text}”
                </blockquote>
                <figcaption className="mt-3 text-sm font-semibold text-neutral-dark">
                  — {testimonial.author}
                </figcaption>
              </figure>
            )}
          </div>
        </div>
      </section>

      <footer className="border-t border-gray-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-gray-500 sm:flex-row sm:px-6">
          <span>© {new Date().getFullYear()} High Desert Property Management · Redmond, Oregon</span>
          <a href="tel:+15415480383" className="font-semibold text-neutral-dark">
            (541) 548-0383
          </a>
        </div>
      </footer>
    </>
  )
}
