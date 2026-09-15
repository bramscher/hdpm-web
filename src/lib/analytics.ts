'use client'

import { sendGAEvent, sendGTMEvent } from '@next/third-parties/google'

/**
 * Conversion / interaction tracking. Fires the Google (GTM/GA4) events the site
 * already relied on, plus the matching Meta Pixel standard events so ad
 * measurement and optimisation work. Every helper is best-effort and must never
 * throw into a UI flow.
 */

type FbqWindow = Window & { fbq?: (...args: unknown[]) => void }

/**
 * Safe Meta Pixel `track` call. The pixel script loads `afterInteractive`, so an
 * event fired from a mount effect (e.g. ViewContent) can race ahead of `fbq`
 * being defined — retry briefly (up to ~3s) instead of silently dropping it.
 * User-initiated events (Lead, Contact, Search) fire well after load and hit the
 * first attempt.
 */
function fbqTrack(
  event: string,
  params?: Record<string, unknown>,
  attempt = 0,
): void {
  try {
    if (typeof window === 'undefined') return
    const { fbq } = window as FbqWindow
    if (typeof fbq !== 'function') {
      if (attempt < 20) {
        setTimeout(() => fbqTrack(event, params, attempt + 1), 150)
      }
      return
    }
    if (params) fbq('track', event, params)
    else fbq('track', event)
  } catch {
    // analytics must never break the page
  }
}

// Forms that are better modelled as a Meta "Contact" than a "Lead".
const CONTACT_FORMS = new Set(['contact'])

/**
 * Fire the lead-conversion event. `form` distinguishes the source
 * ('rental_analysis' | 'contact' | 'listing_inquiry' | 'market_<city>' |
 * 'blog_post' | 'lp_<slug>' | 'tool_<name>').
 *
 * Pushes the GTM-native shape when GTM is configured (trigger on the custom
 * event name `generate_lead` inside the container) and the gtag shape when a
 * bare GA4 tag is configured. Also fires the Meta Pixel `Lead` (or `Contact`
 * for contact-style forms) standard event. No-op for any channel not set.
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
  fbqTrack(CONTACT_FORMS.has(form) ? 'Contact' : 'Lead', { content_name: form })
}

/**
 * Meta Pixel `ViewContent` — a visit to a page worth tracking (a blog post or a
 * rental listing). Fire once on mount from the detail page.
 */
export function trackViewContent(params: {
  contentName: string
  contentCategory: string
  contentIds?: Array<string | number>
  value?: number
  currency?: string
}): void {
  fbqTrack('ViewContent', {
    content_name: params.contentName,
    content_category: params.contentCategory,
    ...(params.contentIds ? { content_ids: params.contentIds, content_type: 'product' } : {}),
    ...(params.value != null ? { value: params.value } : {}),
    ...(params.currency ? { currency: params.currency } : {}),
  })
}

/**
 * Meta Pixel `Search` — fired when a visitor searches/filters the rental
 * listings. `searchString` is a human-readable summary of the active filters.
 */
export function trackSearch(searchString: string, contentCategory = 'rental_listings'): void {
  fbqTrack('Search', {
    search_string: searchString,
    content_category: contentCategory,
  })
}

/**
 * Meta Pixel `Contact` — a click-to-call, text, or email. Called by the
 * delegated link listener in MetaPixel; exported for any explicit use too.
 */
export function trackContact(method: 'call' | 'sms' | 'email'): void {
  fbqTrack('Contact', { content_category: method })
}
