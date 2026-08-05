import { getPayload } from 'payload'
import config from '@payload-config'
import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import Section from '@/components/ui/Section'

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

function GoogleIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

export default async function TestimonialsSection() {
  const payload = await getPayload({ config })

  const { docs: testimonials } = await payload.find({
    collection: 'testimonials',
    where: {
      approved: { equals: true },
      rating: { equals: 5 },
    },
    sort: '-publishedAt',
    limit: 10,
    depth: 0,
  })

  if (testimonials.length === 0) return null

  return (
    <Section tone="white">
      {/* Section header */}
      <Reveal className="mx-auto max-w-2xl text-center">
        <p className="font-heading text-overline uppercase text-accent">
          Testimonials
        </p>
        <h2 className="mt-3 font-heading text-title text-neutral-dark">
          What Our Clients Say
        </h2>
        <p className="mt-4 text-body-lg text-neutral-mid">
          Real reviews from property owners and tenants who trust us with their
          Central Oregon homes.
        </p>
      </Reveal>

      {/* Reviews grid */}
      <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {testimonials.map((testimonial, i) => (
          <Reveal key={testimonial.id} delay={Math.min(i, 3) * 0.07} className="h-full">
            <div className="relative flex h-full flex-col rounded-xl border border-neutral-200 bg-neutral-light p-8 shadow-sm">
              {/* Decorative quote mark */}
              <div className="absolute -top-3 left-6">
                <span className="inline-block rounded-lg bg-accent px-3 py-1 font-heading text-2xl font-bold leading-none text-white">
                  &ldquo;
                </span>
              </div>

              <div className="flex items-center justify-between">
                <StarRating rating={testimonial.rating} />
                {testimonial.source === 'google' && <GoogleIcon />}
              </div>

              <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-neutral-dark">
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
          </Reveal>
        ))}
      </div>

      {/* Google review link */}
      <div className="mt-10 text-center">
        <Link
          href="https://g.page/r/highdesertpm/review"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-neutral-mid transition-colors hover:text-accent"
        >
          <GoogleIcon />
          Leave us a review on Google
        </Link>
      </div>
    </Section>
  )
}
