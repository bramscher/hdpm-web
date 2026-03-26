import type { AppFolioListing } from './appfolio'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://highdesertpm.com'

export function localBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': SITE_URL,
    name: 'High Desert Property Management',
    description:
      'Professional property management services in Central Oregon — Bend, Redmond, Sisters, Prineville, La Pine, and Madras.',
    url: SITE_URL,
    telephone: '(541) 330-0023',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '413 NW Greenwood Ave, Ste 200',
      addressLocality: 'Bend',
      addressRegion: 'OR',
      postalCode: '97703',
      addressCountry: 'US',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 44.0582,
      longitude: -121.3153,
    },
    areaServed: [
      { '@type': 'City', name: 'Bend, OR' },
      { '@type': 'City', name: 'Redmond, OR' },
      { '@type': 'City', name: 'Sisters, OR' },
      { '@type': 'City', name: 'Prineville, OR' },
      { '@type': 'City', name: 'La Pine, OR' },
      { '@type': 'City', name: 'Madras, OR' },
    ],
    openingHours: 'Mo-Fr 09:00-17:00',
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
