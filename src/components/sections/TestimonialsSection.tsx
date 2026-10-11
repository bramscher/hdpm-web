import { getPayload } from 'payload'
import config from '@payload-config'
import type { Testimonial } from '@/payload-types'
import Reveal from '@/components/ui/Reveal'
import Section from '@/components/ui/Section'
import TestimonialsShowcase from './TestimonialsShowcase'

const REVIEW_URL = 'https://g.page/r/highdesertpm/review'

export default async function TestimonialsSection() {
  // Guarded so the section (and the pages that render it, e.g. the home page)
  // degrade to nothing rather than crashing the build when the database is
  // unreachable or unmigrated — Preview deployments connect to a DB without
  // the Payload schema.
  let testimonials: Testimonial[] = []
  try {
    const payload = await getPayload({ config })
    const res = await payload.find({
      collection: 'testimonials',
      where: {
        approved: { equals: true },
        rating: { equals: 5 },
      },
      sort: '-publishedAt',
      limit: 20,
      depth: 0,
    })
    testimonials = res.docs
  } catch {
    return null
  }

  if (testimonials.length === 0) return null

  return (
    <Section tone="white">
      <Reveal className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div className="astra-section-heading max-w-2xl">
          <p className="font-heading text-overline uppercase text-accent">Testimonials</p>
          <h2 className="mt-3 font-heading text-title text-neutral-dark">What Our Clients Say</h2>
        </div>
        <p className="max-w-md text-body-lg text-neutral-mid">
          Real reviews from property owners and tenants who trust us with their Central Oregon
          homes.
        </p>
      </Reveal>

      <TestimonialsShowcase
        reviews={testimonials.map((t) => ({
          id: t.id,
          author: t.author,
          text: t.text,
          rating: t.rating,
          source: t.source,
          publishedAt: t.publishedAt,
        }))}
        reviewUrl={REVIEW_URL}
      />
    </Section>
  )
}
