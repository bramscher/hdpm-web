import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCachedListings } from '@/lib/appfolio'
import { geocodeAddress } from '@/lib/address-lookup'

export const dynamic = 'force-dynamic'

export interface MapListing {
  id: string
  lat: number
  lng: number
  title: string
  address: string
  city: string
  rent: number
  beds: number
  baths: number
  photo: string | null
  available: string
}

/**
 * GET /api/listings/map
 *
 * Current listings with coordinates for the map view. Coordinates come
 * from the listing-geocodes cache; cache misses are geocoded once via
 * Google and persisted, so steady-state serves without external calls.
 */
export async function GET() {
  const listings = await getCachedListings()
  const payload = await getPayload({ config })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY || ''
  const results: MapListing[] = []

  for (const l of listings) {
    const fullAddress = `${l.Address1}, ${l.City}, ${l.State} ${l.Zip}`

    let lat: number | null = null
    let lng: number | null = null

    const cached = await payload.find({
      collection: 'listing-geocodes',
      where: { address: { equals: fullAddress } },
      limit: 1,
      overrideAccess: true,
    })
    if (cached.docs.length > 0) {
      lat = cached.docs[0].lat
      lng = cached.docs[0].lng
    } else if (apiKey) {
      try {
        const geo = await geocodeAddress(fullAddress, apiKey)
        if (geo) {
          lat = geo.geometry.location.lat
          lng = geo.geometry.location.lng
          await payload.create({
            collection: 'listing-geocodes',
            data: { address: fullAddress, lat, lng },
            overrideAccess: true,
          })
        }
      } catch (err) {
        console.warn('[listings/map] geocode failed for', fullAddress, err)
      }
    }

    if (lat === null || lng === null) continue

    results.push({
      id: l.Id,
      lat,
      lng,
      title: l.MarketingTitle,
      address: l.Address1,
      city: l.City,
      rent: l.AdvertisedRent,
      beds: l.Bedrooms,
      baths: l.Bathrooms,
      photo: l.UnitPhotos[0]?.Url ?? null,
      available: l.AvailableOn,
    })
  }

  return NextResponse.json(
    { listings: results },
    { headers: { 'Cache-Control': 's-maxage=900, stale-while-revalidate=3600' } },
  )
}
