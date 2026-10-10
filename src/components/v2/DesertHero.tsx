'use client'

import { useRef } from 'react'
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import Button from '@/components/ui/Button'
import { SERVING_SINCE, YEARS_IN_BUSINESS } from '@/lib/constants'

/**
 * Opening scene. The high desert assembles as you scroll: dawn becomes day,
 * the Cascades rise, a house is drawn onto the land and its windows light up.
 * The narrative caption under the headline follows the scene.
 */

const captions = [
  `Sunrise over the Cascades. We've watched ${YEARS_IN_BUSINESS} years of them.`,
  "A house goes up. Somebody's savings, somebody's future.",
  'We find the people who make it a home, and look after both.',
]

function useWindow(p: MotionValue<number>, from: number, to: number) {
  return useTransform(p, [from - 0.06, from, to, to + 0.06], [0, 1, 1, 0])
}

export default function DesertHero() {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const settled = useMotionValue(1)
  const p = reduced ? settled : scrollYProgress

  // Sky: dawn → morning.
  const skyTop = useTransform(p, [0, 0.5, 1], ['#1c2236', '#41577a', '#8dbbe0'])
  const skyMid = useTransform(p, [0, 0.5, 1], ['#a8566a', '#e79a6b', '#cfe2ee'])
  const skyLow = useTransform(p, [0, 0.5, 1], ['#f2a65a', '#f7cf8f', '#f6ead6'])
  const sky = useMotionTemplate`linear-gradient(180deg, ${skyTop} 0%, ${skyMid} 55%, ${skyLow} 100%)`

  const sunY = useTransform(p, [0, 1], [180, -260])
  const starsOpacity = useTransform(p, [0, 0.3], [0.9, 0])
  const farY = useTransform(p, [0, 1], [70, 0])
  const midY = useTransform(p, [0, 1], [140, 0])
  const nearY = useTransform(p, [0, 1], [220, 0])
  const ridgeTint = useTransform(p, [0, 1], ['#3a3550', '#6f7f92'])
  const midTint = useTransform(p, [0, 1], ['#4a3f45', '#a0896b'])
  const groundTint = useTransform(p, [0, 1], ['#3b2f2a', '#c9a77a'])

  const houseDraw = useTransform(p, [0.28, 0.58], [0, 1])
  const houseFill = useTransform(p, [0.55, 0.66], [0, 1])
  const windowGlow = useTransform(p, [0.66, 0.78], [0, 1])
  const smoke = useTransform(p, [0.75, 1], [0, 1])
  const smokeY = useTransform(p, [0.75, 1], [0, -40])

  const headY = useTransform(p, [0, 1], [0, -24])
  const cue = useTransform(p, [0, 0.08], [1, 0])

  const c0 = useWindow(p, 0, 0.26)
  const c1 = useWindow(p, 0.34, 0.58)
  const c2 = useTransform(p, [0.6, 0.68], [0, 1])
  const captionOpacity = [c0, c1, c2]

  return (
    <section
      ref={ref}
      aria-labelledby="v2-hero-title"
      className={reduced ? 'relative' : 'relative h-[300svh]'}
    >
      <div className="sticky top-[72px] h-[calc(100svh-72px)] min-h-[560px] overflow-hidden">
        <motion.div className="absolute inset-0" style={{ background: sky }} />

        <svg
          aria-hidden="true"
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1600 900"
          preserveAspectRatio="xMidYMax slice"
        >
          <motion.g style={{ opacity: starsOpacity }} fill="#fff">
            {[
              [120, 80], [260, 150], [410, 60], [600, 120], [820, 50], [980, 140],
              [1150, 70], [1320, 130], [1480, 60], [700, 200], [1040, 220], [330, 240],
            ].map(([x, y]) => (
              <circle key={`${x}-${y}`} cx={x} cy={y} r={x % 3 === 0 ? 2 : 1.3} />
            ))}
          </motion.g>

          <motion.g style={{ y: sunY }}>
            <circle cx="1120" cy="640" r="120" fill="#ffd89a" opacity="0.25" />
            <circle cx="1120" cy="640" r="70" fill="#ffe2a8" />
          </motion.g>

          {/* Three Sisters + Broken Top */}
          <motion.g style={{ y: farY }}>
            <motion.path
              style={{ fill: ridgeTint }}
              d="M0 640 L180 600 L300 560 L420 470 L470 430 L520 470 L600 520 L690 410 L740 370 L800 420 L880 500 L960 430 L1010 395 L1070 445 L1160 520 L1260 480 L1330 455 L1400 500 L1600 560 L1600 900 L0 900 Z"
            />
            <path d="M440 452 L470 430 L500 452 L486 462 L470 452 L455 464 Z" fill="#f4f1ea" />
            <path d="M708 393 L740 370 L772 393 L756 405 L740 394 L722 408 Z" fill="#f4f1ea" />
            <path d="M982 414 L1010 395 L1040 416 L1024 425 L1010 416 L995 427 Z" fill="#f4f1ea" />
            <path d="M1305 470 L1330 455 L1352 470 L1340 477 L1328 470 L1316 478 Z" fill="#f4f1ea" />
          </motion.g>

          {/* Rimrock ridge */}
          <motion.g style={{ y: midY }}>
            <motion.path
              style={{ fill: midTint }}
              d="M0 700 L140 680 L260 690 L340 660 L520 662 L560 640 L760 640 L800 668 L980 672 L1100 650 L1300 655 L1340 680 L1600 676 L1600 900 L0 900 Z"
            />
          </motion.g>

          {/* Ground, junipers and the house */}
          <motion.g style={{ y: nearY }}>
            <motion.path style={{ fill: groundTint }} d="M0 735 Q400 715 800 728 T1600 722 L1600 900 L0 900 Z" />
            {[
              [150, 742, 1], [260, 748, 0.7], [1290, 738, 1.1], [1420, 744, 0.8], [1520, 740, 0.6],
            ].map(([x, y, s]) => (
              <g key={x} transform={`translate(${x} ${y}) scale(${s})`} fill="#2f4a35">
                <rect x="-3" y="-8" width="6" height="14" fill="#4b3727" />
                <ellipse cx="0" cy="-30" rx="22" ry="28" />
                <ellipse cx="-12" cy="-18" rx="14" ry="16" />
                <ellipse cx="13" cy="-20" rx="13" ry="15" />
              </g>
            ))}

            <g transform="translate(700 600)">
              <motion.path
                d="M0 130 L0 60 L100 0 L200 60 L200 130"
                fill="#f6efe2"
                style={{ fillOpacity: houseFill }}
              />
              <motion.path
                d="M-14 66 L100 -8 L214 66"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ pathLength: houseDraw }}
              />
              <motion.path
                d="M0 60 L0 130 L200 130 L200 60"
                fill="none"
                stroke="#1a1a1a"
                strokeWidth="6"
                strokeLinejoin="round"
                style={{ pathLength: houseDraw }}
              />
              <motion.rect x="86" y="80" width="30" height="50" fill="#2a2420" style={{ opacity: houseFill }} />
              <motion.rect x="28" y="78" width="36" height="28" rx="2" fill="#ffcf6e" style={{ opacity: windowGlow }} />
              <motion.rect x="138" y="78" width="36" height="28" rx="2" fill="#ffcf6e" style={{ opacity: windowGlow }} />
              <motion.rect x="146" y="14" width="16" height="30" fill="#1a1a1a" style={{ opacity: houseFill }} />
              <motion.g style={{ opacity: smoke, y: smokeY }} fill="#fff" opacity="0.6">
                <circle cx="154" cy="2" r="8" />
                <circle cx="162" cy="-14" r="10" />
                <circle cx="152" cy="-32" r="12" />
              </motion.g>
            </g>
          </motion.g>
        </svg>

        {/* Readability scrim behind the copy */}
        <div className="absolute inset-x-0 top-0 h-2/3 bg-gradient-to-b from-black/45 via-black/15 to-transparent" />

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col px-4 pt-14 pb-8 sm:px-6 sm:pt-20 lg:px-8">
          <motion.div style={{ y: headY }} className="max-w-3xl">
            <p className="font-heading text-overline uppercase tracking-[0.14em] text-white/80">
              {SERVING_SINCE}
            </p>
            <h1
              id="v2-hero-title"
              className="mt-4 font-heading text-display-sm text-white sm:text-display lg:text-display-xl"
            >
              Property management for the place you call home.
            </h1>
            <div className="relative mt-6 min-h-[4.5rem] max-w-xl text-body-lg text-white/90 sm:text-xl">
              {captions.map((text, i) => (
                <motion.p
                  key={text}
                  className={i === 0 ? '' : 'absolute inset-x-0 top-0'}
                  style={{ opacity: captionOpacity[i] }}
                  aria-hidden={i !== 2}
                >
                  {text}
                </motion.p>
              ))}
            </div>
          </motion.div>

          <div className="mt-auto flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button href="/owners" variant="primary" size="lg" elevated withArrow>
                For property owners
              </Button>
              <Button href="/listings" variant="glass" size="lg" withArrow>
                Find a rental home
              </Button>
            </div>
            {!reduced && (
              <motion.div
                style={{ opacity: cue }}
                className="hidden items-center gap-3 text-sm text-white/80 sm:flex"
                aria-hidden="true"
              >
                Scroll to build it
                <span className="relative block h-10 w-px overflow-hidden bg-white/30">
                  <span className="v2-scroll-cue absolute inset-x-0 top-0 h-3 bg-white" />
                </span>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
