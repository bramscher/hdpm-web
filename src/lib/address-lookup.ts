/**
 * Address Lookup — Google Geocoding + RentCast property records.
 *
 * Mirrors the shape used by hdpm-chatbot's `/api/comps/address-lookup`
 * so the public rental-analysis form on hdpm-web collects exactly the
 * same SubjectProperty that the internal analysis engine consumes.
 *
 * Required env vars:
 *   GOOGLE_PLACES_API_KEY — Google Maps key (geocoding-enabled)
 *   RENTCAST_API_KEY     — optional; degrades gracefully if missing
 */

export type Town = 'Bend' | 'Redmond' | 'Sisters' | 'Prineville' | 'Culver'

export type PropertyType =
  | 'SFR'
  | 'Apartment'
  | 'Townhouse'
  | 'Duplex'
  | 'Condo'
  | 'Manufactured'
  | 'Other'

export interface AddressLookupResult {
  formatted_address: string
  street: string
  city: string
  state: string
  zip: string
  county: string | null
  lat: number | null
  lng: number | null
  town: Town | null
  property: PropertyDetails | null
  sources: string[]
}

export interface PropertyDetails {
  bedrooms: number | null
  bathrooms: number | null
  sqft: number | null
  property_type: PropertyType | null
  year_built: number | null
  lot_size: number | null
  last_sale_price: number | null
  last_sale_date: string | null
  features: {
    garage: boolean
    ac: boolean
    heating: boolean
  }
}

const TOWN_MAP: Record<string, Town> = {
  bend: 'Bend',
  redmond: 'Redmond',
  sisters: 'Sisters',
  prineville: 'Prineville',
  culver: 'Culver',
}

function detectTown(city: string): Town | null {
  return TOWN_MAP[city.toLowerCase().trim()] || null
}

interface GeocodingResult {
  formatted_address: string
  address_components: Array<{
    long_name: string
    short_name: string
    types: string[]
  }>
  geometry: { location: { lat: number; lng: number } }
}

interface GeocodingResponse {
  results: GeocodingResult[]
  status: string
  error_message?: string
}

async function geocodeAddress(
  address: string,
  apiKey: string,
): Promise<GeocodingResult | null> {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address,
  )}&key=${apiKey}`
  const res = await fetch(url)
  const data: GeocodingResponse = await res.json()
  if (data.status !== 'OK' || data.results.length === 0) {
    console.error(
      `[AddressLookup] Geocoding status=${data.status} error=${data.error_message || 'no results'}`,
    )
    return null
  }
  return data.results[0]
}

function extractComponent(result: GeocodingResult, type: string): string {
  const comp = result.address_components.find((c) => c.types.includes(type))
  return comp?.long_name || ''
}

function extractShortComponent(result: GeocodingResult, type: string): string {
  const comp = result.address_components.find((c) => c.types.includes(type))
  return comp?.short_name || ''
}

function mapRentCastPropertyType(type: string | undefined): PropertyType | null {
  if (!type) return null
  const t = type.toLowerCase()
  if (t.includes('single family') || t.includes('sfr')) return 'SFR'
  if (t.includes('apartment') || t.includes('apt')) return 'Apartment'
  if (t.includes('townhouse') || t.includes('townhome')) return 'Townhouse'
  if (t.includes('duplex')) return 'Duplex'
  if (t.includes('condo') || t.includes('condominium')) return 'Condo'
  if (t.includes('manufactured') || t.includes('mobile')) return 'Manufactured'
  if (t.includes('multi')) return 'Apartment'
  return 'Other'
}

interface RentCastPropertyRecord {
  formattedAddress?: string
  bedrooms?: number
  bathrooms?: number
  squareFootage?: number
  propertyType?: string
  yearBuilt?: number
  lotSize?: number
  lastSalePrice?: number
  lastSaleDate?: string
  features?: {
    cooling?: boolean
    heating?: boolean
    garage?: boolean
  }
}

async function getRentCastPropertyRecord(
  address: string,
): Promise<RentCastPropertyRecord | null> {
  const apiKey = process.env.RENTCAST_API_KEY
  if (!apiKey) return null

  const url = `https://api.rentcast.io/v1/properties?address=${encodeURIComponent(address)}`
  try {
    const res = await fetch(url, {
      headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
    })
    if (!res.ok) {
      console.warn(`[AddressLookup] RentCast ${res.status}`)
      return null
    }
    const data = (await res.json()) as RentCastPropertyRecord[] | RentCastPropertyRecord
    if (Array.isArray(data)) return data.length > 0 ? data[0] : null
    if (data && typeof data === 'object' && data.formattedAddress) return data
    return null
  } catch (err) {
    console.warn('[AddressLookup] RentCast fetch failed', err)
    return null
  }
}

export async function lookupAddress(
  rawAddress: string,
): Promise<AddressLookupResult | null> {
  const googleKey = process.env.GOOGLE_PLACES_API_KEY
  if (!googleKey) {
    console.warn('[AddressLookup] Missing GOOGLE_PLACES_API_KEY')
    return null
  }

  const sources: string[] = []

  const geo = await geocodeAddress(rawAddress, googleKey)
  if (!geo) return null
  sources.push('Google Geocoding')

  const street = `${extractComponent(geo, 'street_number')} ${extractComponent(
    geo,
    'route',
  )}`.trim()
  const city = extractComponent(geo, 'locality')
  const state = extractShortComponent(geo, 'administrative_area_level_1')
  const zip = extractComponent(geo, 'postal_code')
  const county = extractComponent(geo, 'administrative_area_level_2').replace(' County', '')
  const town = detectTown(city)

  const result: AddressLookupResult = {
    formatted_address: geo.formatted_address,
    street,
    city,
    state,
    zip,
    county: county || null,
    lat: geo.geometry.location.lat,
    lng: geo.geometry.location.lng,
    town,
    property: null,
    sources,
  }

  const rc = await getRentCastPropertyRecord(geo.formatted_address)
  if (rc) {
    sources.push('RentCast')
    result.property = {
      bedrooms: rc.bedrooms ?? null,
      bathrooms: rc.bathrooms ?? null,
      sqft: rc.squareFootage ?? null,
      property_type: mapRentCastPropertyType(rc.propertyType),
      year_built: rc.yearBuilt ?? null,
      lot_size: rc.lotSize ?? null,
      last_sale_price: rc.lastSalePrice ?? null,
      last_sale_date: rc.lastSaleDate ?? null,
      features: {
        garage: rc.features?.garage || false,
        ac: rc.features?.cooling || false,
        heating: rc.features?.heating || false,
      },
    }
  }

  return result
}
