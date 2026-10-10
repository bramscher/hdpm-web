'use client'

import { useMotionValue, useMotionValueEvent, type MotionValue } from 'motion/react'

/**
 * Mirror a scroll-derived value into a plain motion value before binding it
 * to opacity/transform on an HTML element. Motion otherwise hands those to a
 * native ScrollTimeline, which ignores `useScroll` target offsets (and throws
 * on input ranges outside 0..1).
 */
export function useJsDriven<T extends number | string>(source: MotionValue<T>) {
  const out = useMotionValue(source.get())
  useMotionValueEvent(source, 'change', (v) => out.set(v))
  return out
}
