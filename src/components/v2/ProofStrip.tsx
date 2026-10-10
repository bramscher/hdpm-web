'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView, useReducedMotion } from 'motion/react'
import { FOUNDED_YEAR, YEARS_IN_BUSINESS } from '@/lib/constants'

/** Counters that roll up once when the strip scrolls into view. */

const stats = [
  { value: FOUNDED_YEAR, label: 'Managing Central Oregon homes since', from: 1950, decimals: 0, suffix: '' },
  { value: YEARS_IN_BUSINESS, label: 'Years in business', from: 0, decimals: 0, suffix: '' },
  { value: 4.9, label: 'Average rating from owners', from: 0, decimals: 1, suffix: '★' },
  { value: 7, label: 'Towns in our service area', from: 0, decimals: 0, suffix: '' },
]

function Counter({ value, from, decimals, suffix }: { value: number; from: number; decimals: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -15% 0px' })
  const reduced = useReducedMotion()
  const [shown, setShown] = useState(value)

  useEffect(() => {
    if (!inView || reduced) return
    const controls = animate(from, value, {
      duration: 1.4,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setShown(v),
    })
    return () => controls.stop()
  }, [inView, reduced, from, value])

  return (
    <span ref={ref} className="tabular-nums">
      {shown.toFixed(decimals)}
      {suffix}
    </span>
  )
}

export default function ProofStrip() {
  return (
    <section aria-label="High Desert Property Management at a glance" className="border-y border-neutral-200 bg-white">
      <dl className="mx-auto grid max-w-7xl grid-cols-2 gap-y-10 px-4 py-14 sm:px-6 lg:grid-cols-4 lg:px-8">
        {stats.map((s) => (
          <div key={s.label} className="border-l-2 border-accent pl-5">
            <dt className="text-sm text-neutral-mid">{s.label}</dt>
            <dd className="mt-1 font-heading text-display-sm text-neutral-dark">
              <Counter {...s} />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
