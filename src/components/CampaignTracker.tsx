'use client'

import { useEffect } from 'react'

/**
 * Fire-and-forget visit beacon for ad landing pages. Records one visit per
 * campaign per browser session (so refreshes don't inflate counts). Only
 * fires when the URL carried a utm_campaign the server recognized.
 */
export default function CampaignTracker({ campaign }: { campaign: string }) {
  useEffect(() => {
    if (!campaign) return
    const key = `hdpm_cv_${campaign}`
    try {
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, '1')
    } catch {
      // privacy mode — still record the visit, accepting possible refresh dupes
    }
    const body = JSON.stringify({
      campaign,
      landingPath: window.location.pathname + window.location.search,
      referrer: document.referrer || undefined,
    })
    try {
      if (!navigator.sendBeacon?.('/api/campaigns/track', new Blob([body], { type: 'application/json' }))) {
        void fetch('/api/campaigns/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        })
      }
    } catch {
      // measurement is best-effort; never break the page
    }
  }, [campaign])

  return null
}
