'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import {
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type Transition,
} from 'motion/react'

/**
 * Sticky persona scene. The list on the left advances with scroll; the
 * illustration on the right is ONE scene whose pieces rearrange for each
 * persona, so the world transforms instead of cutting between slides.
 */

const personas = [
  {
    tag: 'The accidental landlord',
    title: 'Moved for work. Kept the house.',
    body: "You didn't plan on becoming a landlord. We price it with a free rental analysis, market it, screen every applicant and handle the lease, so the house earns while you're away.",
    href: '/owners',
    cta: 'How owner onboarding works',
  },
  {
    tag: 'The investor',
    title: 'One door or a whole portfolio.',
    body: 'Rent is collected online and on schedule. You get monthly owner statements, year-end tax documents and a real-time owner portal for every property.',
    href: '/tools',
    cta: 'Run the numbers',
  },
  {
    tag: 'The remote owner',
    title: 'Owning Central Oregon from somewhere else.',
    body: 'Our network of licensed local contractors handles repairs, with 24/7 emergency response. You see every work order and statement in the portal, wherever you are.',
    href: '/owners#maintenance',
    cta: 'See how maintenance works',
  },
  {
    tag: 'The renter',
    title: 'Looking for a place to land.',
    body: 'Browse available homes, apply online and pay through the tenant portal with auto-pay. When something breaks, you have a team that answers.',
    href: '/listings',
    cta: 'Browse available rentals',
  },
]

const ease: Transition = { type: 'spring', bounce: 0.15, duration: 0.9 }

function House({ roof = '#1a1a1a', body = '#f6efe2', glow = false }: { roof?: string; body?: string; glow?: boolean }) {
  return (
    <g>
      <path d="M-50 0 L-50 -50 L0 -86 L50 -50 L50 0 Z" fill={body} />
      <path d="M-60 -46 L0 -92 L60 -46" fill="none" stroke={roof} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="-10" y="-34" width="20" height="34" fill="#2a2420" />
      <rect x="-38" y="-40" width="18" height="16" rx="1.5" fill={glow ? '#ffcf6e' : '#cfd8dc'} />
      <rect x="20" y="-40" width="18" height="16" rx="1.5" fill={glow ? '#ffcf6e' : '#cfd8dc'} />
    </g>
  )
}

function Scene({ i, reduced }: { i: number; reduced: boolean }) {
  const t: Transition = reduced ? { duration: 0 } : ease
  const show = (on: boolean, extra: object = {}) => ({ opacity: on ? 1 : 0, ...extra })

  // The hero house travels through every persona.
  const hero = [
    { x: 300, y: 300, scale: 1.6 },
    { x: 140, y: 300, scale: 0.9 },
    { x: 300, y: 300, scale: 1.1 },
    { x: 300, y: 430, scale: 4.2 },
  ][i]

  return (
    <svg viewBox="0 0 600 400" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="ow-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9f1f5" />
          <stop offset="1" stopColor="#f7efe1" />
        </linearGradient>
        <clipPath id="ow-clip">
          <rect width="600" height="400" rx="20" />
        </clipPath>
      </defs>
      <g clipPath="url(#ow-clip)">
        <rect width="600" height="400" fill="url(#ow-sky)" />
        <motion.path
          d="M0 230 L120 170 L190 200 L260 140 L330 190 L420 150 L520 200 L600 180 L600 400 L0 400 Z"
          fill="#c9d3d6"
          animate={{ opacity: i === 3 ? 0 : 1 }}
          transition={t}
        />
        <rect y="300" width="600" height="100" fill="#d9bf95" />

        {/* 0 · moving truck leaves, sign flips to Leased */}
        <motion.g initial={false} animate={show(i === 0, { x: i === 0 ? 0 : 260 })} transition={{ ...t, delay: i === 0 ? 0.25 : 0 }}>
          <g transform="translate(420 300)">
            <rect x="0" y="-56" width="80" height="50" rx="4" fill="#2ecc52" />
            <rect x="80" y="-40" width="34" height="34" rx="4" fill="#22a840" />
            <rect x="88" y="-34" width="18" height="12" rx="2" fill="#e9f1f5" />
            <circle cx="20" cy="-4" r="9" fill="#1a1a1a" />
            <circle cx="96" cy="-4" r="9" fill="#1a1a1a" />
            <text x="40" y="-26" textAnchor="middle" fontSize="11" fontWeight="700" fill="#092a13">MOVING</text>
          </g>
        </motion.g>
        <motion.g initial={false} animate={show(i === 0)} transition={t}>
          <rect x="118" y="236" width="4" height="64" fill="#5b4636" />
          <rect x="78" y="232" width="84" height="34" rx="3" fill="#1a1a1a" />
          <motion.text
            x="120" y="254" textAnchor="middle" fontSize="12" fontWeight="800" fill="#ffffff"
            initial={false}
            animate={{ opacity: i === 0 && !reduced ? [1, 1, 0] : 0 }}
            transition={reduced ? { duration: 0 } : { duration: 1.6, times: [0, 0.7, 1], delay: 0.6 }}
          >
            FOR RENT
          </motion.text>
          <motion.text
            x="120" y="254" textAnchor="middle" fontSize="13" fontWeight="800" fill="#4ade6b"
            initial={false}
            animate={{ opacity: i === 0 && !reduced ? [0, 0, 1] : 1 }}
            transition={reduced ? { duration: 0 } : { duration: 1.6, times: [0, 0.7, 1], delay: 0.6 }}
          >
            LEASED
          </motion.text>
        </motion.g>

        {/* 1 · portfolio grows, rent meters fill */}
        {[260, 380, 500].map((x, k) => (
          <motion.g
            key={x}
            initial={false}
            animate={show(i === 1, { y: i === 1 ? 0 : 40 })}
            transition={{ ...t, delay: i === 1 ? 0.12 * (k + 1) : 0 }}
          >
            <g transform={`translate(${x} 300) scale(0.9)`}>
              <House roof={['#22a840', '#1a1a1a', '#5b4636'][k]} glow />
            </g>
          </motion.g>
        ))}
        {[140, 260, 380, 500].map((x, k) => (
          <motion.g key={`m${x}`} initial={false} animate={show(i === 1)} transition={t}>
            <rect x={x - 34} y="110" width="68" height="10" rx="5" fill="#ffffff" />
            <motion.rect
              x={x - 34} y="110" height="10" rx="5" fill="#2ecc52"
              initial={false}
              animate={{ width: i === 1 ? 68 : 0 }}
              transition={reduced ? { duration: 0 } : { duration: 1.1, delay: 0.5 + k * 0.18, ease: 'easeOut' }}
            />
            <text x={x} y="100" textAnchor="middle" fontSize="11" fill="#3f3f3f">Rent paid</text>
          </motion.g>
        ))}
        <motion.g initial={false} animate={show(i === 1, { y: i === 1 ? 0 : -20 })} transition={{ ...t, delay: 0.9 }}>
          <rect x="28" y="28" width="132" height="46" rx="8" fill="#1a1a1a" />
          <text x="44" y="48" fontSize="10" fill="#a3a3a3">Owner statement</text>
          <text x="44" y="64" fontSize="13" fontWeight="700" fill="#ffffff">Sent on the 1st</text>
        </motion.g>

        {/* 2 · remote owner: distant pin, arc, phone with work order */}
        <motion.g initial={false} animate={show(i === 2)} transition={t}>
          <motion.path
            d="M80 70 Q200 -10 300 200"
            fill="none" stroke="#2ecc52" strokeWidth="3" strokeDasharray="6 8"
            initial={false}
            animate={{ pathLength: i === 2 ? 1 : 0 }}
            transition={reduced ? { duration: 0 } : { duration: 1.2, delay: 0.3 }}
          />
          <circle cx="80" cy="70" r="9" fill="#1a1a1a" />
          <text x="96" y="74" fontSize="12" fontWeight="600" fill="#1a1a1a">You, anywhere</text>
        </motion.g>
        <motion.g initial={false} animate={show(i === 2, { x: i === 2 ? 0 : 80 })} transition={{ ...t, delay: i === 2 ? 0.5 : 0 }}>
          <g transform="translate(420 70)">
            <rect width="132" height="230" rx="18" fill="#1a1a1a" />
            <rect x="8" y="14" width="116" height="202" rx="10" fill="#fafafa" />
            <text x="18" y="38" fontSize="10" fill="#737373">Work order</text>
            <text x="18" y="54" fontSize="12" fontWeight="700" fill="#1a1a1a">Water heater</text>
            <rect x="18" y="66" width="96" height="22" rx="11" fill="#e8f9ec" />
            <motion.text
              x="66" y="81" textAnchor="middle" fontSize="10" fontWeight="700"
              initial={false}
              animate={{ fill: i === 2 ? '#22a840' : '#737373' }}
              transition={{ delay: 1.4 }}
            >
              ✓ Repaired
            </motion.text>
            <text x="18" y="116" fontSize="10" fill="#737373">This month</text>
            <rect x="18" y="124" width="96" height="8" rx="4" fill="#e7e7e7" />
            <rect x="18" y="124" width="80" height="8" rx="4" fill="#2ecc52" />
            <rect x="18" y="142" width="96" height="8" rx="4" fill="#e7e7e7" />
            <rect x="18" y="142" width="54" height="8" rx="4" fill="#1a1a1a" />
          </g>
        </motion.g>

        {/* 3 · renter: the door opens, warm light spills out */}
        <motion.g initial={false} animate={show(i === 3)} transition={{ ...t, delay: i === 3 ? 0.35 : 0 }}>
          <rect x="258" y="130" width="84" height="170" fill="#ffcf6e" />
          <motion.rect
            x="258" y="130" width="84" height="170" fill="#2a2420"
            style={{ originX: '258px' }}
            initial={false}
            animate={{ scaleX: i === 3 ? 0.18 : 1 }}
            transition={reduced ? { duration: 0 } : { duration: 1, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          />
          <path d="M240 300 L360 300 L420 400 L180 400 Z" fill="#ffcf6e" opacity="0.35" />
          <text x="300" y="100" textAnchor="middle" fontSize="20" fontWeight="800" fill="#1a1a1a">Welcome home.</text>
        </motion.g>

        {/* The house that persists across every world */}
        <motion.g
          initial={false}
          style={{ originX: 0.5, originY: 1 }}
          animate={{ ...hero, opacity: i === 3 ? 0 : 1 }}
          transition={t}
        >
          <House glow={i !== 0} />
        </motion.g>
      </g>
    </svg>
  )
}

export default function OwnerWorlds() {
  const ref = useRef<HTMLElement>(null)
  const reduced = !!useReducedMotion()
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    const next = Math.min(personas.length - 1, Math.max(0, Math.floor(v * personas.length)))
    setActive((cur) => (cur === next ? cur : next))
  })

  if (reduced) {
    return (
      <section aria-labelledby="v2-worlds-title" className="bg-neutral-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Header />
          <div className="mt-12 grid gap-10 md:grid-cols-2">
            {personas.map((p, k) => (
              <div key={p.tag} className="rounded-xl border border-neutral-200 bg-white p-6">
                <div className="aspect-[3/2] overflow-hidden rounded-lg">
                  <Scene i={k} reduced />
                </div>
                <PersonaCopy p={p} />
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section
      ref={ref}
      aria-labelledby="v2-worlds-title"
      className="relative bg-neutral-50"
      style={{ height: `${personas.length * 100}svh` }}
    >
      <div className="sticky top-[72px] flex h-[calc(100svh-72px)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16 lg:px-8">
          <div className="order-2 lg:order-1">
            <Header />
            <ol className="mt-6 space-y-1 lg:mt-10">
              {personas.map((p, k) => (
                <li key={p.tag} className="relative pl-5">
                  <span className="absolute inset-y-1 left-0 w-0.5 overflow-hidden rounded-full bg-neutral-200">
                    <motion.span
                      className="absolute inset-x-0 top-0 bg-accent"
                      initial={false}
                      animate={{ height: k <= active ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                    />
                  </span>
                  <p
                    className={`font-heading text-sm font-semibold transition-colors duration-300 ${
                      k === active ? 'text-neutral-dark' : 'text-neutral-400'
                    }`}
                  >
                    {p.tag}
                  </p>
                  <motion.div
                    initial={false}
                    animate={{ height: k === active ? 'auto' : 0, opacity: k === active ? 1 : 0 }}
                    transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                    className="overflow-hidden"
                    aria-hidden={k !== active}
                  >
                    <PersonaCopy p={p} compact />
                  </motion.div>
                </li>
              ))}
            </ol>
          </div>
          <div className="order-1 aspect-[3/2] max-h-[42svh] w-full overflow-hidden rounded-[20px] shadow-[0_30px_60px_-30px_rgb(20_34_24/0.45)] lg:order-2 lg:max-h-none">
            <Scene i={active} reduced={false} />
          </div>
        </div>
      </div>
    </section>
  )
}

function Header() {
  return (
    <div className="astra-section-heading">
      <p className="font-heading text-overline uppercase text-accent">Who we work for</p>
      <h2 id="v2-worlds-title" className="mt-3 font-heading text-title text-neutral-dark">
        Every property has a story.
      </h2>
    </div>
  )
}

function PersonaCopy({ p, compact = false }: { p: (typeof personas)[number]; compact?: boolean }) {
  return (
    <div className={compact ? 'pb-4 pt-2' : 'pt-6'}>
      {!compact && <p className="font-heading text-overline uppercase text-accent">{p.tag}</p>}
      <h3 className="mt-1 font-heading text-subtitle text-neutral-dark">{p.title}</h3>
      <p className="mt-3 max-w-md text-neutral-mid">{p.body}</p>
      <Link
        href={p.href}
        className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-accent-dark hover:underline"
      >
        {p.cta} <span aria-hidden="true">→</span>
      </Link>
    </div>
  )
}
