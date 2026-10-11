'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'
import { useJsDriven } from './useJsDriven'

/**
 * "What a property manager actually does", told one job at a time. The
 * section pins full-bleed while you scroll; each step swaps the photograph
 * and the message, and the rail on the right tracks progress.
 */

/** Scroll distance per step, as a fraction of the viewport. */
const STEP_SVH = 40

const steps = [
  {
    label: 'Tenant placement',
    headline: 'We find the right tenant.',
    body: 'A free rental analysis sets the price. Then marketing, showings, and rigorous screening with background checks, credit reports and rental history.',
    href: '/owners#tenant-placement',
    image: 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1920&q=80&auto=format&fit=crop',
    alt: 'A well-kept Central Oregon home at dusk',
  },
  {
    label: 'Leasing',
    headline: 'We hand over the keys.',
    body: 'Digital lease signing and a smooth move-in, so your tenant starts on the right foot and your property is documented from day one.',
    href: '/owners#tenant-placement',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80&auto=format&fit=crop',
    alt: 'House keys handed over at move-in',
  },
  {
    label: 'Maintenance',
    headline: 'We answer the 2 a.m. call.',
    body: 'Our network of licensed Central Oregon contractors handles repairs quickly and cost-effectively, with 24/7 emergency response included.',
    href: '/owners#maintenance',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1920&q=80&auto=format&fit=crop',
    alt: 'A licensed contractor making a repair',
  },
  {
    label: 'Financial reporting',
    headline: 'We collect the rent and show the numbers.',
    body: 'Online rent collection, monthly owner statements, year-end tax documents, and a real-time owner portal you can check anytime.',
    href: '/owners#reporting',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80&auto=format&fit=crop',
    alt: 'An owner reporting dashboard on a laptop',
  },
  {
    label: 'Your time back',
    headline: 'You enjoy Central Oregon.',
    body: 'Your investment is protected and performing. You get the lake, the trail, and the weekend.',
    href: '/owners',
    image: 'https://images.unsplash.com/photo-1633998125621-a28f4447252a?w=1920&q=80&auto=format&fit=crop',
    alt: 'Couple paddleboarding together on a lake in Central Oregon',
  },
]

export default function ManagementStory() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const rail = useJsDriven(useTransform(scrollYProgress, [0, 1], [0, 1]))

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(steps.length - 1, Math.floor(v * steps.length))
    setActive((cur) => (cur === next ? cur : next))
  })

  if (reduced) return <StaticStory />

  const step = steps[active]

  return (
    <section
      ref={ref}
      aria-labelledby="v2-story-title"
      className="relative bg-primary"
      style={{ height: `calc(100svh + ${steps.length * STEP_SVH}svh)` }}
    >
      <h2 id="v2-story-title" className="sr-only">
        What we do for property owners
      </h2>
      <div className="sticky top-[72px] h-[calc(100svh-72px)] overflow-hidden">
        {/* Photographs: the active one fades up and settles from a slow zoom */}
        {steps.map((s, k) => (
          <motion.div
            key={s.image}
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: k === active ? 1 : 0, scale: k === active ? 1 : 1.08 }}
            transition={{ opacity: { duration: 0.6, ease: 'easeInOut' }, scale: { duration: 1.6, ease: [0.22, 1, 0.36, 1] } }}
            aria-hidden={k !== active}
          >
            <Image src={s.image} alt={s.alt} fill sizes="100vw" className="object-cover" priority={k === 0} />
          </motion.div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-heading text-overline uppercase text-accent-light">
              What we do · <span className="tabular-nums">0{active + 1}</span>
              <span className="text-white/50"> / 0{steps.length}</span>
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, y: 28, filter: 'blur(6px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <p className="mt-6 font-heading text-sm font-semibold uppercase tracking-[0.14em] text-white/70">
                  {step.label}
                </p>
                <h3 className="mt-3 font-heading text-display-sm text-white sm:text-display lg:text-display-xl">
                  {step.headline}
                </h3>
                <p className="mt-6 max-w-xl text-body-lg text-white/85">{step.body}</p>
                <Link
                  href={step.href}
                  className="group mt-8 inline-flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                >
                  Learn more
                  <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
                </Link>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Progress rail */}
        <div className="absolute right-6 top-1/2 z-10 hidden -translate-y-1/2 lg:right-10 lg:flex">
          <div className="relative mr-5 w-px bg-white/20">
            <motion.div className="absolute inset-x-0 top-0 h-full origin-top bg-accent" style={{ scaleY: rail }} />
          </div>
          <ol className="flex flex-col gap-7">
            {steps.map((s, k) => (
              <li
                key={s.label}
                className={`text-right font-heading text-sm font-semibold transition-colors duration-300 ${
                  k === active ? 'text-white' : 'text-white/40'
                }`}
              >
                {s.label}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** Reduced motion: the same story as stacked photo panels, no pinning. */
function StaticStory() {
  return (
    <section aria-labelledby="v2-story-title" className="bg-primary">
      <h2 id="v2-story-title" className="sr-only">
        What we do for property owners
      </h2>
      {steps.map((s) => (
        <div key={s.label} className="relative flex min-h-[70svh] items-center overflow-hidden">
          <Image src={s.image} alt={s.alt} fill sizes="100vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/10" />
          <div className="relative mx-auto w-full max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
            <p className="font-heading text-overline uppercase text-accent-light">{s.label}</p>
            <h3 className="mt-3 max-w-2xl font-heading text-display-sm text-white sm:text-display">{s.headline}</h3>
            <p className="mt-6 max-w-xl text-body-lg text-white/85">{s.body}</p>
          </div>
        </div>
      ))}
    </section>
  )
}
