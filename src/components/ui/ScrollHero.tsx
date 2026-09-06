'use client'

import { motion, useReducedMotion, useScroll, type MotionStyle } from 'motion/react'
import { useRef, type ReactNode } from 'react'

/** Share one scroll timeline between background imagery and heading type. */
export default function ScrollHero({ children, className = '' }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduced = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })

  return (
    <motion.section
      ref={ref}
      className={`astra-scroll-hero ${className}`}
      style={{ '--hero-progress': reduced ? 0 : scrollYProgress } as MotionStyle}
    >
      {children}
    </motion.section>
  )
}
