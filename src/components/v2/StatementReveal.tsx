'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useJsDriven } from './useJsDriven'

/**
 * A single sentence that lights up word by word as it scrolls through the
 * viewport. Highlighted words pick up the brand green.
 */

const sentence =
  'You own the property. We handle everything that comes with it: the tenants, the repairs, the rent, and the peace of mind.'
const highlight = new Set(['everything', 'peace', 'mind.'])

function Word({ word, index, total, progress }: { word: string; index: number; total: number; progress: MotionValue<number> }) {
  const start = index / total
  const end = Math.min(1, start + 1.5 / total)
  const opacity = useJsDriven(useTransform(progress, [start, end], [0.15, 1]))
  return (
    <motion.span style={{ opacity }} className={highlight.has(word) ? 'text-accent' : undefined}>
      {word}{' '}
    </motion.span>
  )
}

export default function StatementReveal() {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.45'] })
  const words = sentence.split(' ')

  return (
    <section aria-label="Our promise" className="astra-section bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="font-heading text-overline uppercase text-accent">Full-service property management</p>
        <div ref={ref} className="mt-6 max-w-5xl font-heading text-[2rem] font-bold leading-[1.15] tracking-[-0.02em] text-neutral-dark sm:text-5xl lg:text-6xl">
          {reduced ? (
            <p>{sentence}</p>
          ) : (
            <p>
              <span className="sr-only">{sentence}</span>
              <span aria-hidden="true">
                {words.map((w, k) => (
                  <Word key={k} word={w} index={k} total={words.length} progress={scrollYProgress} />
                ))}
              </span>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
