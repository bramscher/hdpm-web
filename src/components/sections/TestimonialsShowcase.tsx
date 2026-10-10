'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

export interface ShowcaseReview {
  id: string | number
  author: string
  text: string
  rating: number
  source?: string | null
  publishedAt?: string | null
}

const SPOTLIGHT_MS = 8000

function Stars({ rating, className = 'h-5 w-5' }: { rating: number; className?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <svg key={i} aria-hidden="true" className={`${className} ${i < rating ? 'text-accent' : 'text-neutral-300'}`} fill="currentColor" viewBox="0 0 20 20">
          <path d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" />
        </svg>
      ))}
    </div>
  )
}

export function GoogleIcon({ className = 'h-5 w-5' }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('')
}

function formatDate(iso?: string | null) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

function Avatar({ name, size = 'h-11 w-11 text-sm' }: { name: string; size?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-heading font-bold text-white ${size}`} aria-hidden="true">
      {initials(name)}
    </span>
  )
}

/** Featured quote that rotates through the strongest reviews. */
function Spotlight({ reviews }: { reviews: ShowcaseReview[] }) {
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const review = reviews[index]
  const go = (delta: number) => setIndex((i) => (i + delta + reviews.length) % reviews.length)

  useEffect(() => {
    if (reduced || paused || reviews.length < 2) return
    const t = setTimeout(() => go(1), SPOTLIGHT_MS)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused, reduced, reviews.length])

  return (
    <div
      className="relative flex h-full flex-col rounded-2xl bg-primary p-8 text-white sm:p-12"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <span aria-hidden="true" className="pointer-events-none absolute right-8 top-2 font-heading text-[10rem] leading-none text-white/[0.06]">
        &rdquo;
      </span>

      <div className="relative min-h-[15rem] flex-1 sm:min-h-[13rem]" aria-live="polite">
        <AnimatePresence mode="wait">
          <motion.figure
            key={review.id}
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex h-full flex-col"
          >
            <Stars rating={review.rating} />
            <blockquote className="mt-6 line-clamp-6 font-heading text-xl font-semibold leading-snug sm:text-2xl">
              &ldquo;{review.text}&rdquo;
            </blockquote>
            <figcaption className="mt-auto flex items-center gap-3 pt-8">
              <Avatar name={review.author} />
              <div>
                <p className="font-heading font-bold">{review.author}</p>
                <p className="flex items-center gap-1.5 text-sm text-white/60">
                  {review.source === 'google' && <GoogleIcon className="h-4 w-4" />}
                  {review.source === 'google' ? 'Google review' : 'Client review'}
                  {formatDate(review.publishedAt) && <> · {formatDate(review.publishedAt)}</>}
                </p>
              </div>
            </figcaption>
          </motion.figure>
        </AnimatePresence>
      </div>

      {reviews.length > 1 && (
        <div className="mt-8 flex items-center gap-4">
          <div className="flex flex-1 gap-1.5">
            {reviews.map((r, k) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setIndex(k)}
                aria-label={`Show review from ${r.author}`}
                aria-current={k === index}
                className="group flex h-6 flex-1 items-center"
              >
                <span className="relative block h-1 w-full overflow-hidden rounded-full bg-white/15">
                  {k < index && <span className="absolute inset-0 bg-white/50" />}
                  {k === index && (
                    <motion.span
                      key={`${r.id}-${paused}`}
                      className="absolute inset-y-0 left-0 bg-accent"
                      initial={{ width: reduced || paused ? '100%' : '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: reduced || paused ? 0 : SPOTLIGHT_MS / 1000, ease: 'linear' }}
                    />
                  )}
                </span>
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {[
              { d: -1, label: 'Previous review', path: 'M15 19l-7-7 7-7' },
              { d: 1, label: 'Next review', path: 'M9 5l7 7-7 7' },
            ].map((b) => (
              <button
                key={b.label}
                type="button"
                onClick={() => go(b.d)}
                aria-label={b.label}
                className="flex h-11 w-11 items-center justify-center rounded-full border border-white/20 transition-colors hover:border-accent hover:text-accent"
              >
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={b.path} />
                </svg>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function MarqueeCard({ review }: { review: ShowcaseReview }) {
  return (
    <figure className="flex w-[300px] shrink-0 flex-col rounded-xl border border-neutral-200 bg-white p-6 shadow-[0_2px_0_#e0e5e1] sm:w-[340px]">
      <div className="flex items-center justify-between">
        <Stars rating={review.rating} className="h-4 w-4" />
        {review.source === 'google' && <GoogleIcon className="h-4 w-4" />}
      </div>
      <blockquote className="mt-3 line-clamp-4 text-sm leading-relaxed text-neutral-dark">{review.text}</blockquote>
      <figcaption className="mt-auto flex items-center gap-2.5 pt-5">
        <Avatar name={review.author} size="h-8 w-8 text-xs" />
        <span className="font-heading text-sm font-bold text-neutral-dark">{review.author}</span>
      </figcaption>
    </figure>
  )
}

/** A row that drifts continuously; content is doubled so the loop is seamless. */
function MarqueeRow({ reviews, reverse = false }: { reviews: ShowcaseReview[]; reverse?: boolean }) {
  const duration = `${Math.max(30, reviews.length * 9)}s`
  return (
    <div className="v2-marquee group relative overflow-hidden">
      <div
        className={`v2-marquee-track flex w-max gap-5 py-2 ${reverse ? 'v2-marquee-reverse' : ''}`}
        style={{ '--marquee-duration': duration } as React.CSSProperties}
      >
        {[0, 1].map((copy) => (
          <div key={copy} className="flex gap-5" aria-hidden={copy === 1}>
            {reviews.map((r) => (
              <MarqueeCard key={`${copy}-${r.id}`} review={r} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function TestimonialsShowcase({
  reviews,
  ratingLabel,
  reviewUrl,
}: {
  reviews: ShowcaseReview[]
  ratingLabel: string
  reviewUrl: string
}) {
  const spotlight = reviews.slice(0, 5)
  const rest = reviews.length > 8 ? reviews.slice(5) : reviews
  const half = Math.ceil(rest.length / 2)
  const rowA = rest.slice(0, half)
  const rowB = rest.slice(half)

  return (
    <>
      <div className="mt-14 grid gap-6 lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)]">
        <Spotlight reviews={spotlight} />

        <div className="flex flex-col justify-between gap-6 rounded-2xl border border-neutral-200 bg-[#edf1ee] p-8">
          <div>
            <p className="font-heading text-overline uppercase text-accent">Owner rating</p>
            <p className="mt-4 font-heading text-7xl font-extrabold tracking-tight text-neutral-dark">4.9</p>
            <div className="mt-3">
              <Stars rating={5} className="h-6 w-6" />
            </div>
            <p className="mt-3 text-neutral-mid">{ratingLabel}</p>
          </div>
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-dark transition-colors hover:border-accent hover:text-accent"
          >
            <GoogleIcon />
            Leave us a review on Google
          </a>
        </div>
      </div>

      {rest.length >= 4 && (
        <div className="relative mt-10 space-y-3 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
          <MarqueeRow reviews={rowA} />
          {rowB.length >= 2 && <MarqueeRow reviews={rowB} reverse />}
        </div>
      )}
    </>
  )
}
