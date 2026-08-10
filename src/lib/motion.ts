import type { Transition } from 'motion/react'

/**
 * Shared spring transitions (Apple-style).
 * Durations follow the site motion policy in globals.css.
 */

/** Critically damped — no overshoot. Default for most UI. */
export const springDefault: Transition = { type: 'spring', bounce: 0, duration: 0.4 }

/** Slight bounce — momentum-driven surfaces (drawer, sheets). */
export const springGentle: Transition = { type: 'spring', bounce: 0.2, duration: 0.4 }

/** Opacity-only crossfade — reduced-motion replacement for slides/rises. */
export const fadeTransition: Transition = { duration: 0.3, ease: 'easeOut' }
