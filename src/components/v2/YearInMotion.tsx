'use client'

import { useLayoutEffect, useRef, useState } from 'react'
import {
  motion,
  useReducedMotion,
  useScroll,
  useMotionValue,
  useTransform,
  type MotionValue,
} from 'motion/react'

/**
 * A year of management in one horizontal scroll. Vertical scroll drives the
 * track sideways on desktop; small screens get a native swipe carousel.
 */

const steps = [
  { title: 'Rental analysis', body: 'We price your home against the local market, for free.', icon: 'M4 20 L4 10 M10 20 L10 4 M16 20 L16 13 M22 20 L2 20' },
  { title: 'Marketing', body: 'Your listing goes out with photos and a description that sells the place.', icon: 'M3 11 L17 4 L17 20 L3 13 Z M17 9 L21 9 M17 15 L21 15' },
  { title: 'Screening', body: 'Background checks, credit reports and rental history, verified.', icon: 'M11 4 A7 7 0 1 1 10.99 4 M16 16 L21 21' },
  { title: 'Lease & keys', body: 'Digital lease signing, then keys in hand on move-in day.', icon: 'M8 14 A4 4 0 1 1 7.99 14 M11 12 L21 2 M17 6 L20 9' },
  { title: 'Rent collection', body: 'Online rent collection, with auto-pay for tenants.', icon: 'M3 6 L21 6 L21 18 L3 18 Z M3 10 L21 10 M7 15 L10 15' },
  { title: 'Maintenance', body: 'Licensed local contractors, and 24/7 emergency response.', icon: 'M14 6 A4 4 0 0 0 19 11 L10 20 L6 16 L15 7 A4 4 0 0 0 14 6' },
  { title: 'Reporting', body: 'Monthly owner statements and year-end tax documents.', icon: 'M6 2 L15 2 L19 6 L19 22 L6 22 Z M9 12 L16 12 M9 16 L16 16' },
  { title: 'Renew', body: 'When the lease is up, we renew good tenants or start the cycle again.', icon: 'M20 12 A8 8 0 1 1 17 5.8 M20 3 L20 8 L15 8' },
]

function StepCard({ step, index, progress }: { step: (typeof steps)[number]; index: number; progress?: MotionValue<number> }) {
  // Each card draws its icon as the track brings it into view.
  const center = (index + 0.5) / steps.length
  const fallback = useMotionValue(1)
  const draw = useTransform(progress ?? fallback, [center - 0.2, center - 0.04], [0, 1])

  return (
    <article className="relative flex h-full w-[78vw] max-w-[360px] shrink-0 snap-start flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-7 sm:w-[360px]">
      <span className="font-heading text-6xl font-extrabold text-white/10">{String(index + 1).padStart(2, '0')}</span>
      <svg viewBox="0 0 24 24" className="mt-6 h-12 w-12 text-accent-light" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <motion.path d={step.icon} style={{ pathLength: progress ? draw : 1 }} />
      </svg>
      <h3 className="mt-6 font-heading text-subtitle text-white">{step.title}</h3>
      <p className="mt-3 text-white/70">{step.body}</p>
    </article>
  )
}

export default function YearInMotion() {
  const ref = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const [distance, setDistance] = useState(0)
  const [desktop, setDesktop] = useState(false)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0, 1], [0, -distance])
  const bar = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])

  useLayoutEffect(() => {
    const measure = () => {
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches
      setDesktop(isDesktop)
      const track = trackRef.current
      if (track) setDistance(Math.max(0, track.scrollWidth - window.innerWidth + 64))
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [desktop])

  const scrubbed = desktop && !reduced

  return (
    <section
      ref={ref}
      aria-labelledby="v2-year-title"
      className="relative bg-primary text-white"
      style={scrubbed ? { height: `calc(100svh + ${distance}px)` } : undefined}
    >
      <div className={scrubbed ? 'sticky top-[72px] flex h-[calc(100svh-72px)] flex-col justify-center overflow-hidden' : 'py-24'}>
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-heading text-overline uppercase text-accent-light">What we do</p>
          <h2 id="v2-year-title" className="mt-3 max-w-2xl font-heading text-title">
            A year of property management, one scroll long.
          </h2>
          {scrubbed && (
            <div className="mt-8 h-px w-full max-w-md bg-white/15">
              <motion.div className="h-px bg-accent" style={{ width: bar }} />
            </div>
          )}
        </div>
        <motion.div
          ref={trackRef}
          style={scrubbed ? { x } : undefined}
          className={
            scrubbed
              ? 'mt-12 flex gap-6 pl-[max(2rem,calc((100vw-80rem)/2+2rem))]'
              : 'mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 sm:px-6'
          }
        >
          {steps.map((s, k) => (
            <StepCard key={s.title} step={s} index={k} progress={scrubbed ? scrollYProgress : undefined} />
          ))}
        </motion.div>
      </div>
    </section>
  )
}
