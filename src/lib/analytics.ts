'use client'

import { sendGAEvent } from '@next/third-parties/google'

/**
 * Fire a GA4 lead-conversion event. `form` distinguishes the source
 * ('rental_analysis' | 'contact'). No-op when GA is not configured.
 */
export function trackLead(form: string): void {
  try {
    sendGAEvent('event', 'generate_lead', { form })
  } catch {
    // analytics must never break the form flow
  }
}
