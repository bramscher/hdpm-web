import type { AppFolioListing } from './appfolio'
import { SITE_URL } from '@/lib/site-url'

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
    datePosted: new Date().toISOString(),
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
