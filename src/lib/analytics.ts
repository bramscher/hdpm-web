'use client'

import { sendGAEvent, sendGTMEvent } from '@next/third-parties/google'

/**
 * Fire the lead-conversion event. `form` distinguishes the source
 * ('rental_analysis' | 'contact' | 'market_<city>' | 'blog_post').
 *
 * Pushes the GTM-native shape when GTM is configured (trigger on the custom
 * event name `generate_lead` inside the container) and the gtag shape when a
 * bare GA4 tag is configured. No-op when neither is set.
 */
export function trackLead(form: string): void {
  try {
    if (process.env.NEXT_PUBLIC_GTM_ID) {
      sendGTMEvent({ event: 'generate_lead', form })
    }
    if (process.env.NEXT_PUBLIC_GA_ID) {
      sendGAEvent('event', 'generate_lead', { form })
    }
  } catch {
    // analytics must never break the form flow
  }
}
