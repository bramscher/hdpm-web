'use client'

import { motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { fadeTransition, springDefault } from '@/lib/motion'

/**
 * Scroll-entrance reveal: fade + gentle rise on a critically damped spring.
 * Reduced motion gets an opacity-only crossfade (non-vestibular).
 */
export default function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode
  className?: string
  /** Stagger offset in seconds — cap staggering at ~3 steps. */
  delay?: number
}) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      className={className}
      initial={false}
      whileInView={reduceMotion ? { opacity: 1 } : { opacity: [0.55, 1], y: [24, 0] }}
      viewport={{ once: true, margin: '0px 0px -10% 0px' }}
      transition={{ ...(reduceMotion ? fadeTransition : springDefault), delay }}
    >
      {children}
    </motion.div>
  )
}
