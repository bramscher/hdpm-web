'use client'

/**
 * Meta (Facebook) Pixel — loaded on all public pages (site + ad landing pages),
 * never in the Payload admin. Mirrors how GA/GTM are wired in the public
 * layouts.
 *
 * The Pixel ID defaults to HDPM's production pixel but can be overridden per
 * environment with NEXT_PUBLIC_META_PIXEL_ID (e.g. a separate test pixel, or an
 * empty string to disable on a given deploy).
 *
 * The base snippet fires one PageView on initial load. Because this is a Next.js
 * App Router SPA, subsequent client-side navigations (e.g. browsing from one
 * blog post to the next) don't re-run it — so we fire an extra PageView on each
 * pathname change to keep pageview counts accurate.
 */

import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { trackContact } from '@/lib/analytics'

const PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '1583254100211397'

type FbqWindow = Window & { fbq?: (...args: unknown[]) => void }

export default function MetaPixel() {
  const pathname = usePathname()
  const primed = useRef(false)

  useEffect(() => {
    if (!PIXEL_ID) return
    // The inline snippet already fired the first PageView; skip it here so the
    // initial load isn't double-counted, then track every later navigation.
    if (!primed.current) {
      primed.current = true
      return
    }
    ;(window as FbqWindow).fbq?.('track', 'PageView')
  }, [pathname])

  // Site-wide click-to-contact tracking: any tel:/sms:/mailto: link anywhere on
  // a public page fires a Meta `Contact` event, without wiring each CTA by hand.
  useEffect(() => {
    if (!PIXEL_ID) return
    const onClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement | null)?.closest('a[href]') as
        | HTMLAnchorElement
        | null
      const href = link?.getAttribute('href') || ''
      if (href.startsWith('tel:')) trackContact('call')
      else if (href.startsWith('sms:')) trackContact('sms')
      else if (href.startsWith('mailto:')) trackContact('email')
    }
    document.addEventListener('click', onClick, { capture: true })
    return () => document.removeEventListener('click', onClick, { capture: true })
  }, [])

  if (!PIXEL_ID) return null

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  )
}
