'use client'

// First-touch marketing attribution, captured once per session and attached
// to lead form submissions so lead source is attributable at intake.

export interface Attribution {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmTerm?: string
  utmContent?: string
  referrer?: string
  landingPage?: string
}

const STORAGE_KEY = 'hdpm_attribution'

/** Call on first page view (any page). Keeps the first touch of the session. */
export function captureAttribution(): void {
  if (typeof window === 'undefined') return
  try {
    if (sessionStorage.getItem(STORAGE_KEY)) return
    const params = new URLSearchParams(window.location.search)
    // Compare hostnames, not substrings: an external URL that merely
    // contains our host in its query string must still count as a referrer,
    // and apex<->www navigation must count as internal.
    const internalHosts = new Set([
      window.location.hostname,
      'www.highdesertpm.com',
      'highdesertpm.com',
    ])
    let referrer: string | undefined
    if (document.referrer) {
      try {
        const refHost = new URL(document.referrer).hostname
        if (!internalHosts.has(refHost)) referrer = document.referrer
      } catch {
        referrer = document.referrer
      }
    }
    const attribution: Attribution = {
      utmSource: params.get('utm_source') || undefined,
      utmMedium: params.get('utm_medium') || undefined,
      utmCampaign: params.get('utm_campaign') || undefined,
      utmTerm: params.get('utm_term') || undefined,
      utmContent: params.get('utm_content') || undefined,
      referrer,
      landingPage: window.location.pathname + window.location.search,
    }
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(attribution))
  } catch {
    // sessionStorage unavailable (privacy mode) — attribution is best-effort
  }
}

export function getAttribution(): Attribution {
  if (typeof window === 'undefined') return {}
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Attribution) : {}
  } catch {
    return {}
  }
}
