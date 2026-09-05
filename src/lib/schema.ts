import type { AppFolioListing } from './appfolio'
import { SITE_URL } from '@/lib/site-url'
import { extractYouTubeId, youTubeEmbedUrl, youTubeThumb } from './listing-utils'

/**
 * A STABLE date for a listing's `datePosted` / video `uploadDate`. These pages
 * are `force-dynamic`, so `new Date()` produced a different timestamp on every
 * render — Google requires a stable value and treats a date that moves each
 * crawl as unreliable. Use the availability date when it's a valid past date;
 * otherwise a fixed past constant (future/blank availability), so the value is
 * always valid, in the past, and constant across renders.
 */
const STABLE_SCHEMA_DATE_FALLBACK = '2025-01-01T00:00:00.000Z'
function stableListingDate(listing: AppFolioListing): string {
  const raw = listing.AvailableOn
  if (raw) {
    const d = new Date(raw.includes('T') ? raw : `${raw}T00:00:00Z`)
    if (!Number.isNaN(d.getTime()) && d.getTime() <= Date.now()) return d.toISOString()
  }
  return STABLE_SCHEMA_DATE_FALLBACK
}

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE_URL,
    name: 'High Desert Property Management',
    description:
      'Professional property management services in Central Oregon — Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras.',
    url: SITE_URL,
    telephone: '(541) 548-0383',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '1515 SW Reindeer Ave',
      addressLocality: 'Redmond',
      addressRegion: 'OR',
      postalCode: '97756',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 44.2726,
      longitude: -121.1739,
    },
    areaServed: [
      { '@type': 'City', name: 'Bend, OR' },
      { '@type': 'City', name: 'Redmond, OR' },
      { '@type': 'City', name: 'Sisters, OR' },
      { '@type': 'City', name: 'Prineville, OR' },
      { '@type': 'City', name: 'Culver, OR' },
      { '@type': 'City', name: 'Metolius, OR' },
      { '@type': 'City', name: 'Madras, OR' },
    ],
    openingHours: 'Mo-Fr 09:00-16:00',
    sameAs: [],
  }
}

export function listingSchema(listing: AppFolioListing) {
  return {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: listing.MarketingTitle,
    description: listing.MarketingDescription,
    url: `${SITE_URL}/listings/${listing.Id}`,
    // All listing photos — makes the page eligible for image-rich results.
    // Omitted entirely when a listing has no photos (Google prefers no key
    // over an empty array).
    ...(listing.UnitPhotos.length
      ? { image: listing.UnitPhotos.map((p) => p.Url) }
      : {}),
    datePosted: stableListingDate(listing),
    offers: {
      '@type': 'Offer',
      price: listing.AdvertisedRent,
      priceCurrency: 'USD',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: listing.Address1,
      addressLocality: listing.City,
      addressRegion: listing.State,
      postalCode: listing.Zip,
    },
    numberOfRooms: listing.Bedrooms,
    numberOfBathroomsTotal: listing.Bathrooms,
    floorSize: {
      '@type': 'QuantitativeValue',
      value: listing.SquareFeet,
      unitCode: 'FTK',
    },
  }
}

/**
 * VideoObject markup for a listing's YouTube marketing tour. Emitting this on
 * the listing detail page tells Google the page features a video, making it
 * eligible for video rich results (thumbnail in search + the Videos tab).
 * Returns null when the listing has no parseable YouTube video, so callers can
 * skip it. `uploadDate` is required by Google but AppFolio doesn't expose the
 * real upload date, so we use the render time — matching `listingSchema`'s
 * `datePosted` fallback.
 */
export function listingVideoSchema(listing: AppFolioListing) {
  const videoId = extractYouTubeId(listing.VideoURL)
  if (!videoId) return null
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: `Video tour — ${listing.MarketingTitle}`,
    description: `Video tour of ${listing.Address1}, ${listing.City}, ${listing.State} — a ${listing.Bedrooms} bed / ${listing.Bathrooms} bath rental managed by High Desert Property Management.`,
    thumbnailUrl: [youTubeThumb(videoId)],
    uploadDate: stableListingDate(listing),
    // YouTube-hosted video: embedUrl is the correct signal (contentUrl must be a
    // raw media file, which YouTube doesn't expose, so it's intentionally omitted).
    embedUrl: youTubeEmbedUrl(videoId),
  }
}

export function serviceSchema(city: string, slug: string, description: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    serviceType: 'Property Management',
    name: `${city} Property Management`,
    description,
    url: `${SITE_URL}/market-areas/${slug}`,
    provider: {
      '@type': 'LocalBusiness',
      '@id': SITE_URL,
      name: 'High Desert Property Management',
      telephone: '(541) 548-0383',
    },
    areaServed: {
      '@type': 'City',
      name: `${city}, OR`,
    },
  }
}

export function faqSchema(items: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export function breadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: `${SITE_URL}${item.url}`,
    })),
  }
}
