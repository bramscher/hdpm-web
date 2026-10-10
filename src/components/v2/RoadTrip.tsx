'use client'

import Link from 'next/link'
import { useLayoutEffect, useRef, useState } from 'react'
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
} from 'motion/react'

/**
 * Drive the service area. Scrolling moves a car down the highway from Madras
 * to Bend; each town lights up as the car reaches it and links to its page.
 * Positions are a stylized map of Central Oregon, not to scale.
 */

const towns = [
  { name: 'Madras', slug: 'madras', x: 560, y: 70, note: 'Jefferson County seat' },
  { name: 'Metolius', slug: 'metolius', x: 470, y: 140, note: 'Small-town quiet' },
  { name: 'Culver', slug: 'culver', x: 430, y: 220, note: 'Near Lake Billy Chinook' },
  { name: 'Redmond', slug: 'redmond', x: 540, y: 340, note: 'Fast-growing hub' },
  { name: 'Prineville', slug: 'prineville', x: 800, y: 320, note: 'Crook County seat' },
  { name: 'Sisters', slug: 'sisters', x: 230, y: 420, note: 'Gateway to the Cascades' },
  { name: 'Bend', slug: 'bend', x: 470, y: 560, note: "Central Oregon's largest city" },
]

/** Smooth path through the towns (Catmull-Rom → cubic Bézier). */
function routePath() {
  const pts = towns.map((t) => [t.x, t.y])
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[k - 1] ?? pts[k]
    const p1 = pts[k]
    const p2 = pts[k + 1]
    const p3 = pts[k + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0]} ${c1[1]} ${c2[0]} ${c2[1]} ${p2[0]} ${p2[1]}`
  }
  return d
}
const ROUTE = routePath()

export default function RoadTrip() {
  const ref = useRef<HTMLElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const settled = useMotionValue(1)
  const p = reduced ? settled : scrollYProgress
  const drive = useTransform(p, [0.05, 0.9], [0, 1], { clamp: true })

  const carX = useMotionValue(towns[0].x)
  const carY = useMotionValue(towns[0].y)
  const [stops, setStops] = useState<number[]>(() => towns.map((_, k) => k / (towns.length - 1)))
  const [reached, setReached] = useState(reduced ? towns.length : 1)

  // Where along the route each town sits, as a 0..1 fraction of its length.
  useLayoutEffect(() => {
    const path = pathRef.current
    if (!path) return
    const total = path.getTotalLength()
    const fractions = towns.map((t) => {
      let best = 0
      let bestDist = Infinity
      for (let s = 0; s <= 400; s++) {
        const pt = path.getPointAtLength((s / 400) * total)
        const dist = (pt.x - t.x) ** 2 + (pt.y - t.y) ** 2
        if (dist < bestDist) {
          bestDist = dist
          best = s / 400
        }
      }
      return best
    })
    setStops(fractions)
  }, [])

  const place = (v: number) => {
    const path = pathRef.current
    if (!path) return
    const pt = path.getPointAtLength(v * path.getTotalLength())
    carX.set(pt.x)
    carY.set(pt.y)
    const count = stops.filter((s) => s <= v + 0.005).length
    setReached((cur) => (cur === count ? cur : count))
  }
  useMotionValueEvent(drive, 'change', place)
  useLayoutEffect(() => place(drive.get()))

  return (
    <section
      ref={ref}
      aria-labelledby="v2-road-title"
      className={reduced ? 'relative bg-[#f3efe6] py-24' : 'relative h-[260svh] bg-[#f3efe6]'}
    >
      <div className={reduced ? '' : 'sticky top-[72px] flex h-[calc(100svh-72px)] items-center overflow-hidden'}>
        <div className="mx-auto grid w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,4fr)_minmax(0,6fr)] lg:gap-12 lg:px-8">
          <div>
            <div className="astra-section-heading">
              <p className="font-heading text-overline uppercase text-accent">Where we work</p>
              <h2 id="v2-road-title" className="mt-3 font-heading text-title text-neutral-dark">
                Seven towns. One team that knows every road.
              </h2>
            </div>
            <p className="mt-5 max-w-md text-body-lg text-neutral-mid">
              From Madras to Bend, we manage homes across Central Oregon, and we know what each
              neighborhood rents for.
            </p>
            <ul className="mt-6 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3 lg:grid-cols-2">
              {towns.map((t, k) => (
                <li key={t.slug}>
                  <Link
                    href={`/market-areas/${t.slug}`}
                    className={`group flex items-center gap-2 py-1.5 font-heading font-semibold transition-colors duration-300 ${
                      k < reached ? 'text-neutral-dark' : 'text-neutral-400'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full transition-colors duration-300 ${k < reached ? 'bg-accent' : 'bg-neutral-300'}`}
                      aria-hidden="true"
                    />
                    <span className="group-hover:underline">{t.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative aspect-[10/7] max-h-[48svh] w-full lg:max-h-[72svh]">
            <svg viewBox="0 0 1000 640" className="h-full w-full" aria-hidden="true">
              {/* Cascade crest along the west edge */}
              <path d="M0 640 L0 120 L40 160 L70 90 L105 150 L130 60 L170 140 L195 100 L230 190 L250 640 Z" fill="#dfe5e0" />
              <path d="M60 104 L70 90 L80 104 M122 74 L130 60 L138 74" stroke="#fff" strokeWidth="6" fill="none" strokeLinecap="round" />
              {/* Lake Billy Chinook */}
              <path d="M350 170 q30 -20 50 10 q15 25 -10 40 q-30 10 -45 -15 q-8 -20 5 -35 Z" fill="#b9d3df" />

              <path d={ROUTE} fill="none" stroke="#e2d6bf" strokeWidth="22" strokeLinecap="round" />
              <path ref={pathRef} d={ROUTE} fill="none" stroke="#bfae8f" strokeWidth="3" strokeDasharray="10 12" />
              <motion.path d={ROUTE} fill="none" stroke="#1a1a1a" strokeWidth="6" strokeLinecap="round" style={{ pathLength: drive }} />

              {towns.map((t, k) => {
                const lit = k < reached
                const labelLeft = t.x > 700 || t.slug === 'redmond'
                return (
                  <g key={t.slug}>
                    <motion.circle
                      cx={t.x}
                      cy={t.y}
                      initial={false}
                      animate={{ r: lit ? 14 : 8, fill: lit ? '#2ecc52' : '#ffffff' }}
                      stroke="#1a1a1a"
                      strokeWidth="3"
                      transition={{ type: 'spring', bounce: 0.4, duration: 0.5 }}
                    />
                    <text
                      x={labelLeft ? t.x + 24 : t.x - 24}
                      y={t.y + 6}
                      textAnchor={labelLeft ? 'start' : 'end'}
                      fontSize="24"
                      fontWeight="800"
                      fill={lit ? '#1a1a1a' : '#a3a3a3'}
                      style={{ transition: 'fill 300ms' }}
                    >
                      {t.name}
                    </text>
                    <motion.text
                      x={labelLeft ? t.x + 24 : t.x - 24}
                      y={t.y + 30}
                      textAnchor={labelLeft ? 'start' : 'end'}
                      fontSize="15"
                      fill="#626664"
                      initial={false}
                      animate={{ opacity: lit ? 1 : 0 }}
                    >
                      {t.note}
                    </motion.text>
                  </g>
                )
              })}

              {/* The car */}
              {!reduced && (
                <motion.g style={{ x: carX, y: carY }}>
                  <circle r="22" fill="#2ecc52" opacity="0.25" />
                  <circle r="11" fill="#1a1a1a" stroke="#fff" strokeWidth="3" />
                </motion.g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}
