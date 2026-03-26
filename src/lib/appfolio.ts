/**
 * AppFolio Integration for HDPM Website
 *
 * Uses the v0 Database API for listing DATA (address, rent, beds, baths, etc.)
 * and scrapes the public AppFolio listings page for permanent CDN image URLs.
 *
 * API base: https://api.appfolio.com/api/v0
 * Public page: https://highdesertpm.appfolio.com/listings
 *
 * Required env vars:
 *   APPFOLIO_CLIENT_ID
 *   APPFOLIO_CLIENT_SECRET
 *   APPFOLIO_DEVELOPER_ID
 */

// ============================================
// Public Interface (consumed by all pages/components)
// ============================================

export interface AppFolioListing {
  Id: string
  Address1: string
  City: string
  State: string
  Zip: string
  AdvertisedRent: number
  Bedrooms: number
  Bathrooms: number
  SquareFeet: number
  AvailableOn: string
  MarketingTitle: string
  MarketingDescription: string
  UnitPhotos: { Url: string; Caption?: string }[]
  UnitAmenities: string[]
  ApplicationURL: string
  CatsAllowed: boolean
  DogPolicy: string
  Deposit: number
  PropertyType?: string
  PropertyId?: string
  AppFolioDetailId?: string
}

// ============================================
// Config
// ============================================

const APPFOLIO_V0_BASE = 'https://api.appfolio.com/api/v0'
const APPFOLIO_PUBLIC_BASE = 'https://highdesertpm.appfolio.com'
const CDN_IMAGE_REGEX = /https:\/\/images\.cdn\.appfolio\.com\/highdesertpm\/images\/[a-f0-9-]+\/large\.jpg/g

function getConfig() {
  const clientId = process.env.APPFOLIO_CLIENT_ID
  const clientSecret = process.env.APPFOLIO_CLIENT_SECRET
  const developerId = process.env.APPFOLIO_DEVELOPER_ID

  if (!clientId || !clientSecret || !developerId) {
    return null
  }

  return { clientId, clientSecret, developerId }
}

// ============================================
// Address normalization for matching
// ============================================

/**
 * Normalize an address for fuzzy matching.
 * Strips punctuation, lowercases, and trims.
 * Works for both partial (v0 API: "496 NW 9th Street")
 * and full addresses (public page: "496 NW 9th Street, Prineville, OR 97754").
 */
function normalizeAddress(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if two addresses match.
 * Since v0 API addresses are partial (no city/state) and public page
 * addresses are full, we check if one contains the other.
 */
function addressesMatch(a: string, b: string): boolean {
  const normA = normalizeAddress(a)
  const normB = normalizeAddress(b)
  if (!normA || !normB) return false
  return normA.includes(normB) || normB.includes(normA)
}

// ============================================
// Public page scraping: CDN image URLs
// ============================================

export interface PublicListingInfo {
  primaryImageUrl: string | null
  detailPageId: string
  allPhotoUrls?: string[]
}

/**
 * Fetch the public AppFolio listings page and extract:
 * - Address -> primary CDN image URL
 * - Address -> detail page ID
 *
 * Returns a Map keyed by the raw address string from the public page.
 */
export async function fetchPublicListingPhotos(): Promise<Map<string, PublicListingInfo>> {
  const result = new Map<string, PublicListingInfo>()

  try {
    const response = await fetch(`${APPFOLIO_PUBLIC_BASE}/listings`, {
      headers: {
        'User-Agent': 'HDPM-Website/1.0',
        Accept: 'text/html',
      },
      next: { revalidate: 900 },
    })

    if (!response.ok) {
      console.error(`[AppFolio] Public listings page returned ${response.status}`)
      return result
    }

    const html = await response.text()

    // Extract listing cards from the HTML.
    // The page contains JSON-like data with addresses, image URLs, and detail page links.
    // Pattern: each listing has an address, a detail link, and an image URL.

    // Extract all detail page IDs and their associated data
    // Detail links look like: /listings/detail/{uuid}
    const detailLinkRegex = /\/listings\/detail\/([a-f0-9-]+)/g
    const detailIds: string[] = []
    let detailMatch
    while ((detailMatch = detailLinkRegex.exec(html)) !== null) {
      if (!detailIds.includes(detailMatch[1])) {
        detailIds.push(detailMatch[1])
      }
    }

    // Extract addresses - they appear in the format "address":"424 NE Chestnut St. , Madras, OR 97741"
    // or as text content near listing cards
    const addressRegex = /"address"\s*:\s*"([^"]+)"/g
    const addresses: string[] = []
    let addrMatch
    while ((addrMatch = addressRegex.exec(html)) !== null) {
      addresses.push(addrMatch[1])
    }

    // Extract CDN image URLs in order of appearance
    const imageUrls: string[] = []
    let imgMatch
    // Reset regex state
    CDN_IMAGE_REGEX.lastIndex = 0
    while ((imgMatch = CDN_IMAGE_REGEX.exec(html)) !== null) {
      if (!imageUrls.includes(imgMatch[0])) {
        imageUrls.push(imgMatch[0])
      }
    }

    // If we got structured JSON data with addresses, pair them with detail IDs and images
    if (addresses.length > 0 && detailIds.length > 0) {
      for (let i = 0; i < addresses.length; i++) {
        const address = addresses[i]
        const detailId = detailIds[i] || detailIds[0]
        const primaryImage = imageUrls[i] || null

        result.set(address, {
          primaryImageUrl: primaryImage,
          detailPageId: detailId,
        })
      }
    }

    // Fallback: also try to parse listing blocks from HTML structure
    // Each listing card typically has a link, an image, and address text
    if (result.size === 0) {
      // Try a more general approach: find listing blocks with both detail links and images
      // Pattern: blocks containing /listings/detail/{id} near CDN image URLs
      const listingBlockRegex = /\/listings\/detail\/([a-f0-9-]+)[\s\S]*?(?:images\.cdn\.appfolio\.com\/highdesertpm\/images\/[a-f0-9-]+\/large\.jpg)/g
      let blockMatch
      while ((blockMatch = listingBlockRegex.exec(html)) !== null) {
        const blockDetailId = blockMatch[1]
        const blockText = blockMatch[0]

        // Find the CDN image in this block
        CDN_IMAGE_REGEX.lastIndex = 0
        const blockImgMatch = CDN_IMAGE_REGEX.exec(blockText)
        const blockImgUrl = blockImgMatch ? blockImgMatch[0] : null

        // Find address near this block (look for common address patterns)
        const nearbyAddrRegex = /(\d+\s+[A-Za-z0-9\s.]+(?:St|Ave|Rd|Dr|Ln|Ct|Blvd|Way|Pl|Cir|Loop|Hwy|Terrace|Drive|Street|Avenue|Road|Lane|Court|Boulevard|Place|Circle)[.\s]*,?\s*[A-Za-z\s]+,\s*[A-Z]{2}\s*\d{5})/i
        const nearbyAddr = nearbyAddrRegex.exec(blockText)

        if (nearbyAddr) {
          result.set(nearbyAddr[1].trim(), {
            primaryImageUrl: blockImgUrl,
            detailPageId: blockDetailId,
          })
        }
      }
    }

    console.log(`[AppFolio] Scraped ${result.size} listings from public page (${imageUrls.length} images, ${detailIds.length} detail IDs)`)
    return result
  } catch (err) {
    console.error('[AppFolio] Failed to scrape public listings page:', err)
    return result
  }
}

/**
 * Fetch all photos from a specific listing's detail page.
 * Returns an array of CDN image URLs.
 */
export async function fetchDetailPagePhotos(
  detailId: string,
): Promise<{ Url: string; Caption?: string }[]> {
  try {
    const response = await fetch(`${APPFOLIO_PUBLIC_BASE}/listings/detail/${detailId}`, {
      headers: {
        'User-Agent': 'HDPM-Website/1.0',
        Accept: 'text/html',
      },
      next: { revalidate: 900 },
    })

    if (!response.ok) {
      console.warn(`[AppFolio] Detail page ${detailId} returned ${response.status}`)
      return []
    }

    const html = await response.text()

    // Extract all unique CDN image URLs from the detail page
    const urls = new Set<string>()
    CDN_IMAGE_REGEX.lastIndex = 0
    let match
    while ((match = CDN_IMAGE_REGEX.exec(html)) !== null) {
      urls.add(match[0])
    }

    const photos = Array.from(urls).map((url, i) => ({
      Url: url,
      Caption: i === 0 ? 'Primary photo' : `Photo ${i + 1}`,
    }))

    console.log(`[AppFolio] Detail page ${detailId}: found ${photos.length} photos`)
    return photos
  } catch (err) {
    console.warn(`[AppFolio] Failed to fetch detail page ${detailId}:`, err)
    return []
  }
}

// ============================================
// v0 API Client
// ============================================

interface V0ListResponse<T = Record<string, unknown>> {
  data: T[]
  next_page_path?: string | null
}

async function v0Fetch<T>(
  path: string,
  params: Record<string, string>,
  clientId: string,
  clientSecret: string,
  developerId: string,
): Promise<V0ListResponse<T>> {
  const url = new URL(`${APPFOLIO_V0_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Basic ${auth}`,
      'X-AppFolio-Developer-ID': developerId,
      Accept: 'application/json',
    },
    next: { revalidate: 900 }, // 15-minute ISR cache
  })

  const text = await response.text()

  // Handle retryable errors (533 = data unavailable, 429 = rate limit)
  if (response.status === 533 || response.status === 429) {
    console.warn(`[AppFolio] ${response.status} on ${path}, retrying in 3s...`)
    await new Promise((r) => setTimeout(r, 3000))
    const retryResponse = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Basic ${auth}`,
        'X-AppFolio-Developer-ID': developerId,
        Accept: 'application/json',
      },
      next: { revalidate: 900 },
    })
    const retryText = await retryResponse.text()
    if (!retryResponse.ok) {
      throw new Error(`AppFolio v0 error (${retryResponse.status}): ${retryText.substring(0, 300)}`)
    }
    try {
      return JSON.parse(retryText) as V0ListResponse<T>
    } catch {
      throw new Error(`AppFolio v0 invalid JSON on retry: ${retryText.substring(0, 200)}`)
    }
  }

  if (!response.ok) {
    throw new Error(`AppFolio v0 error (${response.status}): ${text.substring(0, 300)}`)
  }

  try {
    return JSON.parse(text) as V0ListResponse<T>
  } catch {
    throw new Error(`AppFolio v0 invalid JSON: ${text.substring(0, 200)}`)
  }
}

// ============================================
// v0 API Types
// ============================================

interface V0Property {
  Id: string
  Name?: string
  Address1?: string
  Address2?: string
  City?: string
  State?: string
  Zip?: string
  PropertyType?: string
  LastUpdatedAt?: string
  HiddenAt?: string | null
}

interface V0Unit {
  Id: string
  PropertyId?: string
  Bedrooms?: number | string
  Bathrooms?: number | string
  SquareFeet?: number | string
  ListedRent?: number | string
  MarketRent?: number | string
  RentReady?: boolean
  AvailableOn?: string
  MarketingDescription?: string
  AppliancesIncluded?: string[]
  Address1?: string
  Address2?: string | null
  City?: string
  State?: string
  Zip?: string
  Status?: string
  Name?: string
}

// ============================================
// Number parsing (v0 API returns some as strings)
// ============================================

function parseNumber(val: unknown): number {
  if (val == null) return 0
  if (typeof val === 'number' && !Number.isNaN(val)) return val
  if (typeof val === 'string') {
    const n = parseFloat(val.replace(/[^0-9.-]/g, ''))
    return Number.isNaN(n) ? 0 : n
  }
  return 0
}

// ============================================
// Availability check
// ============================================

/**
 * Determine if a unit is available for rent.
 * A unit is considered available if:
 * - Status contains "Vacant" or is empty/undefined
 * - OR it has an AvailableOn date (indicating it will be available)
 * - AND it has a listed rent > 0
 *
 * Excludes units that are clearly occupied:
 * - Status contains "Occupied", "Leased", "Current"
 */
function isUnitAvailable(unit: V0Unit): boolean {
  const status = (unit.Status || '').toLowerCase().trim()
  const rent = parseNumber(unit.ListedRent) || parseNumber(unit.MarketRent)

  // Must have a rent amount
  if (!rent || rent <= 0) return false

  // Explicitly occupied/leased units are not available
  if (
    status.includes('occupied') ||
    status.includes('leased') ||
    status.includes('current') ||
    status.includes('notice') ||
    status.includes('eviction')
  ) {
    return false
  }

  // Vacant units are available
  if (status.includes('vacant') || status === '' || !status) {
    return true
  }

  // Units with an AvailableOn date are available (future availability)
  if (unit.AvailableOn) {
    return true
  }

  // RentReady units are available
  if (unit.RentReady) {
    return true
  }

  return false
}

// ============================================
// Fetch Properties (paginated)
// ============================================

async function fetchAllProperties(
  clientId: string,
  clientSecret: string,
  developerId: string,
): Promise<V0Property[]> {
  const allProperties: V0Property[] = []
  let pageNumber = 1
  const pageSize = 1000

  while (true) {
    console.log(`[AppFolio] Fetching properties page ${pageNumber}...`)
    const res = await v0Fetch<V0Property>(
      '/properties',
      {
        'filters[LastUpdatedAtFrom]': '2020-01-01T00:00:00Z',
        'page[number]': String(pageNumber),
        'page[size]': String(pageSize),
      },
      clientId,
      clientSecret,
      developerId,
    )

    const properties = res.data || []
    allProperties.push(...properties)
    console.log(`[AppFolio] Page ${pageNumber}: ${properties.length} properties`)

    if (properties.length < pageSize || !res.next_page_path) {
      break
    }
    pageNumber++

    if (pageNumber > 10) {
      console.warn('[AppFolio] Hit max page limit (10), stopping pagination')
      break
    }
  }

  return allProperties
}

// ============================================
// Fetch All Units (paginated)
// ============================================

async function fetchAllUnits(
  clientId: string,
  clientSecret: string,
  developerId: string,
): Promise<V0Unit[]> {
  const allUnits: V0Unit[] = []
  let pageNumber = 1
  const pageSize = 1000

  while (true) {
    console.log(`[AppFolio] Fetching units page ${pageNumber}...`)
    const res = await v0Fetch<V0Unit>(
      '/units',
      {
        'filters[LastUpdatedAtFrom]': '2020-01-01T00:00:00Z',
        'page[number]': String(pageNumber),
        'page[size]': String(pageSize),
      },
      clientId,
      clientSecret,
      developerId,
    )

    const units = res.data || []
    allUnits.push(...units)
    console.log(`[AppFolio] Page ${pageNumber}: ${units.length} units`)

    if (units.length < pageSize || !res.next_page_path) {
      break
    }
    pageNumber++

    if (pageNumber > 10) {
      console.warn('[AppFolio] Hit max unit page limit (10), stopping pagination')
      break
    }
  }

  return allUnits
}

// ============================================
// Map unit+property to AppFolioListing
// ============================================

function buildListing(
  property: V0Property,
  unit: V0Unit,
  photos: { Url: string; Caption?: string }[],
  detailId?: string,
): AppFolioListing {
  const rent = parseNumber(unit.ListedRent) || parseNumber(unit.MarketRent)
  const beds = Math.round(parseNumber(unit.Bedrooms))
  const baths = parseNumber(unit.Bathrooms)
  const sqft = Math.round(parseNumber(unit.SquareFeet))

  // Use unit address if available, otherwise property address
  const address1 =
    unit.Address1 || [property.Address1, unit.Name].filter(Boolean).join(' - ') || ''
  const city = unit.City || property.City || ''
  const state = unit.State || property.State || 'OR'
  const zip = unit.Zip || property.Zip || ''

  // Listing ID: prefer unit ID for multi-unit, property ID for single-family
  const listingId = unit.Id || property.Id

  // Build marketing title
  const title =
    property.Name || `${beds}BR/${baths}BA in ${city}` || `Rental in ${city}`

  // Build application URL
  const applicationURL = `https://highdesertpm.appfolio.com/listings`

  return {
    Id: listingId,
    Address1: address1,
    City: city,
    State: state,
    Zip: zip,
    AdvertisedRent: rent,
    Bedrooms: beds,
    Bathrooms: baths,
    SquareFeet: sqft,
    AvailableOn: unit.AvailableOn || '',
    MarketingTitle: title,
    MarketingDescription: unit.MarketingDescription || '',
    UnitPhotos: photos,
    UnitAmenities: unit.AppliancesIncluded || [],
    ApplicationURL: applicationURL,
    CatsAllowed: false, // Not available in v0 API
    DogPolicy: 'Contact for details',
    Deposit: rent, // Default deposit to rent amount
    PropertyType: property.PropertyType || undefined,
    PropertyId: property.Id,
    AppFolioDetailId: detailId,
  }
}

// ============================================
// Public: Get all available listings
// ============================================

export async function getListings(): Promise<AppFolioListing[]> {
  const config = getConfig()
  if (!config) {
    console.warn('[AppFolio] Missing API credentials, returning mock listings')
    return getMockListings()
  }

  const { clientId, clientSecret, developerId } = config

  try {
    // Step 1: Fetch public page to get CDN image URLs and detail IDs
    const publicData = await fetchPublicListingPhotos()
    console.log(`[AppFolio] Public page: ${publicData.size} listings with images`)

    // Step 2: Fetch all properties from v0 API
    const allProperties = await fetchAllProperties(clientId, clientSecret, developerId)
    console.log(`[AppFolio] Total properties: ${allProperties.length}`)

    // Filter out hidden properties
    const activeProperties = allProperties.filter((p) => !p.HiddenAt)

    // Build a map for quick lookup
    const propertyMap = new Map<string, V0Property>()
    for (const p of activeProperties) {
      propertyMap.set(p.Id, p)
    }

    // Step 3: Fetch all units from v0 API
    const allUnits = await fetchAllUnits(clientId, clientSecret, developerId)
    console.log(`[AppFolio] Total units: ${allUnits.length}`)

    // Step 4: Filter to available units only
    const availableUnits = allUnits.filter((unit) => {
      // Unit must belong to an active property
      if (!unit.PropertyId || !propertyMap.has(unit.PropertyId)) return false
      return isUnitAvailable(unit)
    })
    console.log(`[AppFolio] Available units: ${availableUnits.length}`)

    // Step 5: Build listings, matching with public page data for photos
    const listings: AppFolioListing[] = []

    for (const unit of availableUnits) {
      const property = propertyMap.get(unit.PropertyId!)!
      const unitAddr = unit.Address1 || property.Address1 || ''

      // Try to match this unit's address to a public page listing
      let matchedPublicInfo: PublicListingInfo | null = null
      for (const [publicAddr, info] of publicData.entries()) {
        if (addressesMatch(unitAddr, publicAddr)) {
          matchedPublicInfo = info
          break
        }
      }

      // Only include listings that appear on the public page (filter out unpublished)
      if (!matchedPublicInfo) {
        console.log(`[AppFolio] Skipping unpublished listing: ${unitAddr} (${unit.Id})`)
        continue
      }

      // Use CDN image URL as the primary photo
      const photos: { Url: string; Caption?: string }[] = []
      if (matchedPublicInfo.primaryImageUrl) {
        photos.push({
          Url: matchedPublicInfo.primaryImageUrl,
          Caption: 'Primary photo',
        })
      }

      listings.push(buildListing(property, unit, photos, matchedPublicInfo.detailPageId))
    }

    console.log(`[AppFolio] Total published listings: ${listings.length}`)
    return listings
  } catch (err) {
    console.error('[AppFolio] Failed to fetch listings:', err)
    return getMockListings()
  }
}

// ============================================
// Public: Get single listing by ID (live, no cache)
// ============================================

export async function getListingById(id: string): Promise<AppFolioListing | undefined> {
  const config = getConfig()
  if (!config) {
    const mocks = getMockListings()
    return mocks.find((l) => l.Id === id)
  }

  // For live lookups, get all listings (which includes public page matching)
  const listings = await getListings()
  return listings.find((l) => l.Id === id)
}

// ============================================
// Public: Get listings by city
// ============================================

export async function getListingsByCity(city: string): Promise<AppFolioListing[]> {
  const listings = await getListings()
  return listings.filter((l) => l.City.toLowerCase() === city.toLowerCase())
}

// ============================================
// Supabase-cached listing helpers
// ============================================

interface WebListingRow {
  id: string
  address: string
  city: string
  state: string
  zip: string
  rent: number
  beds: number
  baths: number
  sqft: number
  description: string
  marketing_title: string
  available_date: string
  pet_friendly: boolean
  cats_allowed: boolean
  dog_policy: string
  photos: { Url: string; Caption?: string }[]
  amenities: string[]
  application_url: string
  property_type: string | null
  status: string
  deposit: number
  lease_terms: string | null
  property_id: string | null
  appfolio_detail_id: string | null
  synced_at: string
  updated_at: string
}

function rowToListing(row: WebListingRow): AppFolioListing {
  return {
    Id: row.id,
    Address1: row.address,
    City: row.city,
    State: row.state,
    Zip: row.zip,
    AdvertisedRent: Number(row.rent),
    Bedrooms: Number(row.beds),
    Bathrooms: Number(row.baths),
    SquareFeet: Number(row.sqft),
    AvailableOn: row.available_date,
    MarketingTitle: row.marketing_title,
    MarketingDescription: row.description,
    UnitPhotos: row.photos || [],
    UnitAmenities: row.amenities || [],
    ApplicationURL: row.application_url,
    CatsAllowed: row.cats_allowed,
    DogPolicy: row.dog_policy,
    Deposit: Number(row.deposit),
    PropertyType: row.property_type || undefined,
    AppFolioDetailId: row.appfolio_detail_id || undefined,
  }
}

/**
 * Get all available listings from the Supabase cache.
 * Falls back to live AppFolio API if cache is empty or errored.
 */
export async function getCachedListings(): Promise<AppFolioListing[]> {
  try {
    // Dynamic import to avoid bundling supabase in edge contexts where not needed
    const { supabaseAdmin } = await import('@/lib/supabase')

    const { data, error } = await supabaseAdmin
      .from('web_listings')
      .select('*')
      .order('rent', { ascending: true })

    if (error) {
      console.warn('[AppFolio] Supabase cache read error, falling back to live API:', error.message)
      return getListings()
    }

    if (!data || data.length === 0) {
      console.warn('[AppFolio] Supabase cache empty, falling back to live API')
      return getListings()
    }

    console.log(`[AppFolio] Serving ${data.length} listings from Supabase cache`)
    return (data as WebListingRow[]).map(rowToListing)
  } catch (err) {
    console.warn('[AppFolio] Supabase cache error, falling back to live API:', err)
    return getListings()
  }
}

/**
 * Get a single listing by ID from the Supabase cache.
 * For detail pages, fetches ALL photos from the AppFolio detail page
 * using the stored appfolio_detail_id.
 */
export async function getCachedListingById(id: string): Promise<AppFolioListing | undefined> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')

    const { data, error } = await supabaseAdmin
      .from('web_listings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      console.warn(`[AppFolio] Cache miss for listing ${id}, falling back to live API`)
      return getListingById(id)
    }

    const listing = rowToListing(data as WebListingRow)

    // For detail pages, fetch ALL photos from the public detail page
    const detailId = (data as WebListingRow).appfolio_detail_id
    if (detailId) {
      try {
        const detailPhotos = await fetchDetailPagePhotos(detailId)
        if (detailPhotos.length > 0) {
          listing.UnitPhotos = detailPhotos
        }
      } catch (photoErr) {
        console.warn(`[AppFolio] Failed to fetch detail page photos for ${id}:`, photoErr)
      }
    }

    return listing
  } catch (err) {
    console.warn(`[AppFolio] Cache error for listing ${id}, falling back to live API:`, err)
    return getListingById(id)
  }
}

/**
 * Get cached listings filtered by city.
 * Falls back to live AppFolio API if cache is empty or errored.
 */
export async function getCachedListingsByCity(city: string): Promise<AppFolioListing[]> {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase')

    const { data, error } = await supabaseAdmin
      .from('web_listings')
      .select('*')
      .ilike('city', city)
      .order('rent', { ascending: true })

    if (error) {
      console.warn('[AppFolio] Supabase cache read error for city, falling back:', error.message)
      return getListingsByCity(city)
    }

    if (!data || data.length === 0) {
      // Could be legitimately no listings in this city, or cache empty.
      // Check if cache has any data at all.
      const { count } = await supabaseAdmin
        .from('web_listings')
        .select('id', { count: 'exact', head: true })

      if (!count || count === 0) {
        console.warn('[AppFolio] Supabase cache empty, falling back to live API for city')
        return getListingsByCity(city)
      }

      // Cache has data, just no listings for this city
      return []
    }

    return (data as WebListingRow[]).map(rowToListing)
  } catch (err) {
    console.warn('[AppFolio] Cache error for city listings, falling back:', err)
    return getListingsByCity(city)
  }
}

// ============================================
// Mock listings (fallback when API creds missing)
// ============================================

function getMockListings(): AppFolioListing[] {
  return [
    {
      Id: '1',
      Address1: '1234 NW Galveston Ave',
      City: 'Bend',
      State: 'OR',
      Zip: '97703',
      AdvertisedRent: 2200,
      Bedrooms: 3,
      Bathrooms: 2,
      SquareFeet: 1450,
      AvailableOn: '2026-04-15',
      MarketingTitle: 'Stunning NW Bend Home with Mountain Views',
      MarketingDescription:
        'Beautifully updated 3-bedroom home in NW Bend with Cascade mountain views.',
      UnitPhotos: [],
      UnitAmenities: ['Garage', 'Fenced Yard', 'Washer/Dryer', 'Central AC'],
      ApplicationURL: 'https://highdesertpm.appfolio.com/listings',
      CatsAllowed: true,
      DogPolicy: 'Dogs allowed with deposit',
      Deposit: 2200,
    },
  ]
}
