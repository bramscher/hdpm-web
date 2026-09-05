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

import {
  catsAllowedFromApi,
  decodeHtmlEntities,
  dogPolicyFromApi,
  extractRentZapUrl,
  extractYouTubeId,
  youTubeWatchUrl,
} from './listing-utils'

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
  // Unique RentZap application link for this listing (from the marketing
  // description or scraped from the AppFolio detail page). Undefined if none.
  RentZapURL?: string
  // YouTube video URL for the property tour, scraped from the AppFolio detail
  // page gallery (AppFolio's "Marketing Video" field). Undefined if none.
  VideoURL?: string
}

// ============================================
// Config
// ============================================

const APPFOLIO_V0_BASE = 'https://api.appfolio.com/api/v0'
const APPFOLIO_PUBLIC_BASE = 'https://highdesertpm.appfolio.com'
// AppFolio serves photos as large.jpeg (most), large.jpg, or large.png — match all,
// plus webp defensively. Missing "jpeg" here silently dropped every photo on
// jpeg-only listings (e.g. /listings/1403).
const CDN_IMAGE_REGEX = /https:\/\/images\.cdn\.appfolio\.com\/highdesertpm\/images\/[a-f0-9-]+\/large\.(?:jpe?g|png|webp)/g

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

interface PositionedMatch {
  value: string
  index: number
}

function closestMatch(
  matches: PositionedMatch[],
  targetIndex: number,
  maxDistance?: number,
): PositionedMatch | null {
  if (matches.length === 0) return null
  const closest = matches.reduce((nearest, match) =>
    Math.abs(match.index - targetIndex) < Math.abs(nearest.index - targetIndex) ? match : nearest,
  )
  if (maxDistance !== undefined && Math.abs(closest.index - targetIndex) > maxDistance) {
    return null
  }
  return closest
}

// ============================================
// Public page scraping: CDN image URLs
// ============================================

export interface PublicListingInfo {
  primaryImageUrl: string | null
  detailPageId: string
  allPhotoUrls?: string[]
}

// ============================================
// Fetch freshness
// ============================================

/** Default ISR window for AppFolio fetches (15 minutes). */
const LISTINGS_REVALIDATE = 900

/**
 * Build the Next.js caching options for an AppFolio fetch.
 *
 * Normal (scheduled) reads use the 15-minute ISR cache to stay cheap. A manual
 * admin "Sync Now" passes `forceFresh` to bypass the cache entirely, so it
 * genuinely re-pulls from AppFolio instead of replaying the last cached response
 * (which is why a corrected primary image wouldn't otherwise show up on demand).
 */
function freshnessOpts(forceFresh?: boolean): RequestInit {
  return forceFresh ? { cache: 'no-store' } : { next: { revalidate: LISTINGS_REVALIDATE } }
}

/**
 * Fetch the public AppFolio listings page and extract:
 * - Address -> primary CDN image URL
 * - Address -> detail page ID
 *
 * Returns a Map keyed by the raw address string from the public page.
 */
export async function fetchPublicListingPhotos(
  forceFresh = false,
): Promise<Map<string, PublicListingInfo>> {
  const result = new Map<string, PublicListingInfo>()

  try {
    const response = await fetch(`${APPFOLIO_PUBLIC_BASE}/listings`, {
      headers: {
        'User-Agent': 'HDPM-Website/1.0',
        Accept: 'text/html',
      },
      ...freshnessOpts(forceFresh),
    })

    if (!response.ok) {
      console.error(`[AppFolio] Public listings page returned ${response.status}`)
      return result
    }

    const html = await response.text()

    // Preferred: parse the structured listings JSON the page embeds. Each object
    // carries address, default_photo_url, listing_id, and detail_page_url
    // TOGETHER, so we sidestep the fragile positional pairing below — detail
    // links ALSO appear in the HTML cards near the top of the page, far
    // (>6000 chars) from the address JSON blob, which collapsed the map to a
    // single entry and made the whole v0-API path publish ~1 listing.
    const jsonMatch = html.match(/(\[(?:\{[^{}]*"address"[^{}]*\},?\s*)+\])/)
    if (jsonMatch) {
      try {
        const parsed: PublicPageListing[] = JSON.parse(jsonMatch[1])
        for (const pl of parsed) {
          const detailPageId = pl.detail_page_url?.match(/detail\/([a-f0-9-]+)/)?.[1] || ''
          if (!pl.address || !detailPageId) continue
          result.set(pl.address, {
            primaryImageUrl: pl.default_photo_url || null,
            detailPageId,
          })
        }
      } catch {
        // Malformed JSON — fall through to the regex-based extraction below.
      }
    }

    // Extract listing cards from the HTML.
    // The page contains JSON-like data with addresses, image URLs, and detail page links.
    // Pattern: each listing has an address, a detail link, and an image URL.

    // Extract all detail page IDs and their positions. Positions let us pair
    // each detail link with nearby address/image data instead of assuming
    // independent regex result arrays share the same order.
    // Detail links look like: /listings/detail/{uuid}
    const detailLinkRegex = /\/listings\/detail\/([a-f0-9-]+)/g
    const detailIds: string[] = []
    const detailMatches: PositionedMatch[] = []
    let detailMatch
    while ((detailMatch = detailLinkRegex.exec(html)) !== null) {
      if (!detailIds.includes(detailMatch[1])) {
        detailIds.push(detailMatch[1])
        detailMatches.push({ value: detailMatch[1], index: detailMatch.index })
      }
    }

    // Extract addresses - they appear in the format "address":"424 NE Chestnut St. , Madras, OR 97741"
    // or as text content near listing cards
    const addressRegex = /"address"\s*:\s*"([^"]+)"/g
    const addresses: PositionedMatch[] = []
    let addrMatch
    while ((addrMatch = addressRegex.exec(html)) !== null) {
      addresses.push({ value: addrMatch[1], index: addrMatch.index })
    }

    // Extract CDN image URLs in order of appearance
    const imageUrls: PositionedMatch[] = []
    let imgMatch: RegExpExecArray | null
    // Reset regex state
    CDN_IMAGE_REGEX.lastIndex = 0
    while ((imgMatch = CDN_IMAGE_REGEX.exec(html)) !== null) {
      const imageUrl = imgMatch[0]
      const imageIndex = imgMatch.index
      if (!imageUrls.some((image) => image.value === imageUrl)) {
        imageUrls.push({ value: imageUrl, index: imageIndex })
      }
    }

    // Fallback pairing (only if the JSON parse above found nothing): pair each
    // detail link with the nearest address/image from the surrounding page data.
    if (result.size === 0 && addresses.length > 0 && detailMatches.length > 0) {
      for (const detail of detailMatches) {
        const address = closestMatch(addresses, detail.index, 6000)
        if (!address) continue

        const primaryImage = closestMatch(imageUrls, detail.index, 6000)
        result.set(address.value, {
          primaryImageUrl: primaryImage?.value || null,
          detailPageId: detail.value,
        })
      }
    }

    // Fallback: also try to parse listing blocks from HTML structure
    // Each listing card typically has a link, an image, and address text
    if (result.size === 0) {
      // Try a more general approach: find listing blocks with both detail links and images
      // Pattern: blocks containing /listings/detail/{id} near CDN image URLs
      const listingBlockRegex = /\/listings\/detail\/([a-f0-9-]+)[\s\S]*?(?:images\.cdn\.appfolio\.com\/highdesertpm\/images\/[a-f0-9-]+\/large\.(?:jpe?g|png|webp))/g
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
// A real browser User-Agent — AppFolio omits the RentZap apply link (and some
// markup) when the request looks like a bot, so scraping it needs this.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

const RENTZAP_APPLY_URL = /https?:\/\/(?:www\.)?rentzap\.com\/apply\/\d+/i

/** The stable AppFolio image UUID from a CDN URL (…/images/<uuid>/large.jpeg). */
function imageIdFromUrl(url: string): string | null {
  return url.match(/\/images\/([a-f0-9-]+)\//)?.[1] ?? null
}

/**
 * Fetch a listing's public AppFolio detail page once and pull out both the
 * gallery photos and the unique RentZap application link (which AppFolio only
 * embeds for browser-looking requests).
 */
export async function fetchDetailPage(
  detailId: string,
  forceFresh = false,
): Promise<{
  photos: { Url: string; Caption?: string }[]
  rentZapUrl: string | null
  videoUrl: string | null
}> {
  try {
    const response = await fetch(`${APPFOLIO_PUBLIC_BASE}/listings/detail/${detailId}`, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html',
      },
      ...freshnessOpts(forceFresh),
    })

    if (!response.ok) {
      console.warn(`[AppFolio] Detail page ${detailId} returned ${response.status}`)
      return { photos: [], rentZapUrl: null, videoUrl: null }
    }

    const html = await response.text()

    // Extract all unique CDN image URLs from the detail page
    const urls = new Set<string>()
    CDN_IMAGE_REGEX.lastIndex = 0
    let match
    while ((match = CDN_IMAGE_REGEX.exec(html)) !== null) {
      urls.add(match[0])
    }
    const ordered = Array.from(urls)

    // Force AppFolio's designated default/cover photo to position 0. The default
    // is the detail page's og:image (its image UUID matches the grid's
    // default_photo_url), which is more reliable than gallery HTML order. og:image
    // is usually a medium.* variant, so match on the stable image UUID, not the URL.
    const ogTag = html.match(/<meta[^>]+property=["']og:image["'][^>]*>/i)?.[0]
    const ogId = ogTag ? imageIdFromUrl(ogTag.match(/content=["']([^"']+)["']/i)?.[1] ?? '') : null
    if (ogId) {
      const idx = ordered.findIndex((u) => imageIdFromUrl(u) === ogId)
      if (idx > 0) {
        const [primary] = ordered.splice(idx, 1)
        ordered.unshift(primary)
      }
    }

    const photos = ordered.map((url, i) => ({
      Url: url,
      Caption: i === 0 ? 'Primary photo' : `Photo ${i + 1}`,
    }))

    const rentZapUrl = html.match(RENTZAP_APPLY_URL)?.[0] ?? null

    // AppFolio's "Marketing Video" renders as a gallery link to YouTube.
    const videoId = extractYouTubeId(html)
    const videoUrl = videoId ? youTubeWatchUrl(videoId) : null

    console.log(
      `[AppFolio] Detail page ${detailId}: found ${photos.length} photos${rentZapUrl ? ', rentzap link' : ''}${videoUrl ? ', video' : ''}`,
    )
    return { photos, rentZapUrl, videoUrl }
  } catch (err) {
    console.warn(`[AppFolio] Failed to fetch detail page ${detailId}:`, err)
    return { photos: [], rentZapUrl: null, videoUrl: null }
  }
}

/** Photos-only wrapper (used by the sync cron). */
export async function fetchDetailPagePhotos(
  detailId: string,
  forceFresh = false,
): Promise<{ Url: string; Caption?: string }[]> {
  const { photos } = await fetchDetailPage(detailId, forceFresh)
  return photos
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
  forceFresh = false,
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
    ...freshnessOpts(forceFresh), // 15-minute ISR cache unless a manual sync forces fresh
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
      ...freshnessOpts(forceFresh),
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
  // Pet policy also lives at the property level; used as a fallback when the
  // unit's own value is null/blank (matches how AppFolio's public page resolves it).
  CatsAllowed?: string | null
  DogsAllowed?: string | null
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
  MarketingTitle?: string
  MarketingDescription?: string
  AppliancesIncluded?: string[]
  // Structured feature list AppFolio renders under "Amenities" ({Name, Price}).
  Amenities?: { Name: string; Price?: string }[]
  UtilitiesIncluded?: string[]
  // Pet policy enums: "Yes" | "No" | "Small Only" | "Large & Small" | null | "".
  CatsAllowed?: string | null
  DogsAllowed?: string | null
  Deposit?: number | string
  // AppFolio's "Marketing Video" — a YouTube URL (empty string when none).
  YouTubeURL?: string | null
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
 * - Status contains an explicit availability signal
 * - OR it has an AvailableOn date / RentReady flag
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

  // Explicitly available units are available.
  if (
    status.includes('available') ||
    status.includes('vacant') ||
    status.includes('rent ready') ||
    status.includes('rentready')
  ) {
    return true
  }

  // Units with an AvailableOn date are available (future availability).
  // Blank statuses are common in the API, but should not be enough by themselves.
  if (
    unit.AvailableOn &&
    (/^now$/i.test(unit.AvailableOn.trim()) ||
      !Number.isNaN(new Date(unit.AvailableOn).getTime()))
  ) {
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
  forceFresh = false,
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
      forceFresh,
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
  forceFresh = false,
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
      forceFresh,
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

  // Title: use AppFolio's own MarketingTitle verbatim so the site matches the
  // AppFolio listing exactly. Fall back to the property name, then a synthesized
  // "3BR/2BA in City" only when AppFolio has no marketing title at all.
  const title =
    unit.MarketingTitle?.trim() ||
    property.Name ||
    `${beds}BR/${baths}BA in ${city}` ||
    `Rental in ${city}`

  // Amenities: AppFolio's public page splits features into Amenities, Utilities
  // Included, and Appliances. Combine them (deduped, order preserved) into the
  // single amenities list the site renders.
  const amenities = Array.from(
    new Set(
      [
        ...(unit.Amenities?.map((a) => a.Name) ?? []),
        ...(unit.UtilitiesIncluded ?? []),
        ...(unit.AppliancesIncluded ?? []),
      ]
        .map((a) => (a ?? '').trim())
        .filter(Boolean),
    ),
  )

  // Pet policy — authoritative from the v0 API (unit value, property fallback),
  // replacing the detail-page scrape that misread "Cats not allowed".
  const catsAllowed = catsAllowedFromApi(unit.CatsAllowed, property.CatsAllowed)
  const dogPolicy = dogPolicyFromApi(unit.DogsAllowed, property.DogsAllowed)

  // Marketing "video": AppFolio exposes it as YouTubeURL on the unit. Normalize
  // to a canonical watch URL; ignore anything that isn't a real YouTube link.
  const videoId = extractYouTubeId(unit.YouTubeURL)
  const videoUrl = videoId ? youTubeWatchUrl(videoId) : undefined

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
    UnitAmenities: amenities,
    ApplicationURL: applicationURL,
    CatsAllowed: catsAllowed,
    DogPolicy: dogPolicy,
    Deposit: parseNumber(unit.Deposit) || rent, // fall back to rent when unset
    PropertyType: property.PropertyType || undefined,
    PropertyId: property.Id,
    AppFolioDetailId: detailId,
    VideoURL: videoUrl,
  }
}

// ============================================
// Public page-only fallback: scrape listings without v0 API
// ============================================

interface PublicPageListing {
  address: string
  default_photo_url: string
  rent_range: string
  unit_specs: string
  listing_id: number
  detail_page_url: string
  latitude?: number
  longitude?: number
}

/**
 * Parse detail page HTML for availability, pets, deposit, description, and amenities.
 */
async function fetchDetailPageData(
  detailId: string,
  forceFresh = false,
): Promise<{
  marketingTitle: string
  availableOn: string
  description: string
  catsAllowed: boolean
  dogPolicy: string
  deposit: number
  amenities: string[]
}> {
  const defaults = {
    marketingTitle: '',
    availableOn: '',
    description: '',
    catsAllowed: false,
    dogPolicy: 'Contact for details',
    deposit: 0,
    amenities: [],
  }
  try {
    const response = await fetch(`${APPFOLIO_PUBLIC_BASE}/listings/detail/${detailId}`, {
      headers: { 'User-Agent': 'HDPM-Website/1.0', Accept: 'text/html' },
      ...freshnessOpts(forceFresh),
    })
    if (!response.ok) return defaults
    const html = await response.text()

    // Marketing title — AppFolio's public page heading
    // (<h2 class="listing-detail__title">…</h2>). This is the same title the v0
    // API returns as MarketingTitle, so the fallback path matches the API path.
    const titleMatch = html.match(/listing-detail__title[^>]*>([^<]+)</)
    const marketingTitle = titleMatch ? decodeHtmlEntities(titleMatch[1]).trim() : ''

    // Availability date: "Available 4/3/26" or "Available Now"
    const availMatch = html.match(/Available\s+(Now|\d{1,2}\/\d{1,2}\/\d{2,4})/i)
    let availableOn = ''
    if (availMatch) {
      if (availMatch[1].toLowerCase() === 'now') {
        availableOn = 'Now'
      } else {
        // Convert M/D/YY to YYYY-MM-DD
        const parts = availMatch[1].split('/')
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0')
          const day = parts[1].padStart(2, '0')
          let year = parts[2]
          if (year.length === 2) year = `20${year}`
          availableOn = `${year}-${month}-${day}`
        } else {
          availableOn = availMatch[1]
        }
      }
    }

    // Description from og:description
    const descMatch = html.match(/property="og:description"\s+content="([^"]*)"/)
    const description = descMatch ? decodeHtmlEntities(descMatch[1]) : ''

    // Pet policy — AppFolio renders each policy as its own list item:
    //   <ul class="js-pet-policy-list">
    //     <li class="js-pet-policy-item">Cats allowed</li>
    //     <li class="js-pet-policy-item">Small dogs allowed</li>
    //   </ul>
    // Parse those items directly. The old approach regex-matched "Dogs allowed"
    // from the raw HTML, which anchored on the word "Dogs" and silently dropped
    // qualifiers like "Small" (e.g. "Small dogs allowed" → "dogs allowed").
    const petItems: string[] = []
    const petRegex = /js-pet-policy-item[^>]*>([^<]+)</g
    let petMatch
    while ((petMatch = petRegex.exec(html)) !== null) {
      petItems.push(decodeHtmlEntities(petMatch[1]).trim())
    }
    const dogItem = petItems.find((i) => /dogs?/i.test(i))
    const dogPolicy = dogItem || 'Contact for details'
    const catItem = petItems.find((i) => /cats?/i.test(i))
    // Cats are allowed only when the item affirmatively says "allowed" and is
    // not a "not allowed" form. AppFolio writes "Cats not allowed" (not "No
    // cats"), so the old `!/no\s+cats?/i` test misread it as allowed.
    const catsAllowed = catItem
      ? /allowed/i.test(catItem) && !/not\s+allowed/i.test(catItem)
      : false

    // Deposit
    const depositMatch = html.match(/Security\s+Deposit:\s*\$?([\d,]+)/i)
    const deposit = depositMatch ? parseInt(depositMatch[1].replace(/,/g, ''), 10) : 0

    // Amenities — AppFolio's public page splits features into three sections,
    // each an <h3>Label</h3> followed by <ul class="list"><li class="list__item">.
    // Combine them (Amenities + Utilities Included + Appliances), matching the
    // v0-API path's ordering, so both paths render the same list. The old
    // `class="amenity"` regex matched nothing on the current markup.
    const sectionItems = (heading: string): string[] => {
      const section = html.match(
        new RegExp(`>${heading}</h3>\\s*<ul[^>]*>([\\s\\S]*?)</ul>`, 'i'),
      )
      if (!section) return []
      return Array.from(section[1].matchAll(/list__item[^>]*>([^<]+)</g)).map((m) =>
        decodeHtmlEntities(m[1]).trim(),
      )
    }
    const amenities = Array.from(
      new Set(
        [
          ...sectionItems('Amenities'),
          ...sectionItems('Utilities Included'),
          ...sectionItems('Appliances'),
        ].filter(Boolean),
      ),
    )

    return { marketingTitle, availableOn, description, catsAllowed, dogPolicy, deposit, amenities }
  } catch {
    return defaults
  }
}

/**
 * Build listings entirely from the public AppFolio listings page.
 * No v0 API credentials required. Scrapes the main listings page for
 * basic data (address, rent, beds/baths/sqft, photo, detail ID) and
 * optionally enriches from detail pages.
 */
async function getListingsFromPublicPage(forceFresh = false): Promise<AppFolioListing[]> {
  try {
    const response = await fetch(`${APPFOLIO_PUBLIC_BASE}/listings`, {
      headers: { 'User-Agent': 'HDPM-Website/1.0', Accept: 'text/html' },
      ...freshnessOpts(forceFresh),
    })
    if (!response.ok) {
      console.error(`[AppFolio] Public page returned ${response.status}`)
      return getMockListings()
    }

    const html = await response.text()

    // Extract the JSON listings array — it's a standalone array of objects with "address" keys
    const jsonMatch = html.match(/(\[(?:\{[^{}]*"address"[^{}]*\},?\s*)+\])/)
    if (!jsonMatch) {
      console.error('[AppFolio] Could not find listings JSON in public page')
      return getMockListings()
    }

    let publicListings: PublicPageListing[]
    try {
      publicListings = JSON.parse(jsonMatch[1])
    } catch {
      console.error('[AppFolio] Failed to parse listings JSON from public page')
      return getMockListings()
    }

    console.log(`[AppFolio] Public page fallback: found ${publicListings.length} listings`)

    const listings: AppFolioListing[] = []

    for (const pl of publicListings) {
      // Parse address: "424 NE Chestnut St. , Madras, OR 97741"
      const addrParts = pl.address.split(',').map((s) => s.trim())
      const address1 = addrParts[0] || ''
      const city = addrParts[1] || ''
      const stateZip = (addrParts[2] || '').split(/\s+/)
      const state = stateZip[0] || 'OR'
      const zip = stateZip[1] || ''

      // Parse rent: "$1,695" or "$1,695 - $1,895"
      const rentStr = pl.rent_range.replace(/[^0-9]/g, '')
      const rent = parseInt(rentStr, 10) || 0

      // Parse unit specs: "3 bd, 2.5 ba, 1,126 Sq. Ft."
      const bedsMatch = pl.unit_specs.match(/([\d.]+)\s*bd/i)
      const bathsMatch = pl.unit_specs.match(/([\d.]+)\s*ba/i)
      const sqftMatch = pl.unit_specs.match(/([\d,]+)\s*Sq/i)
      const beds = bedsMatch ? Math.round(parseFloat(bedsMatch[1])) : 0
      const baths = bathsMatch ? parseFloat(bathsMatch[1]) : 0
      const sqft = sqftMatch ? parseInt(sqftMatch[1].replace(/,/g, ''), 10) : 0

      // Detail page ID from URL
      const detailMatch = pl.detail_page_url.match(/detail\/([a-f0-9-]+)/)
      const detailId = detailMatch ? detailMatch[1] : ''

      // Photo
      const photos: { Url: string; Caption?: string }[] = []
      if (pl.default_photo_url) {
        photos.push({ Url: pl.default_photo_url, Caption: 'Primary photo' })
      }

      // Fetch detail page for richer data (rate-limited)
      let detailData = {
        marketingTitle: '',
        availableOn: '',
        description: '',
        catsAllowed: false,
        dogPolicy: 'Contact for details',
        deposit: rent,
        amenities: [] as string[],
      }
      if (detailId) {
        detailData = await fetchDetailPageData(detailId, forceFresh)
        if (!detailData.deposit) detailData.deposit = rent
        // Brief delay to avoid hammering the server
        await new Promise((r) => setTimeout(r, 500))
      }

      listings.push({
        Id: String(pl.listing_id),
        Address1: address1,
        City: city,
        State: state,
        Zip: zip,
        AdvertisedRent: rent,
        Bedrooms: beds,
        Bathrooms: baths,
        SquareFeet: sqft,
        AvailableOn: detailData.availableOn,
        MarketingTitle: detailData.marketingTitle || `${beds}BR/${baths}BA in ${city}`,
        MarketingDescription: detailData.description,
        UnitPhotos: photos,
        UnitAmenities: detailData.amenities,
        ApplicationURL: `${APPFOLIO_PUBLIC_BASE}/listings/detail/${detailId}`,
        CatsAllowed: detailData.catsAllowed,
        DogPolicy: detailData.dogPolicy,
        Deposit: detailData.deposit,
        AppFolioDetailId: detailId,
      })
    }

    console.log(`[AppFolio] Public page fallback: built ${listings.length} listings`)
    return listings
  } catch (err) {
    console.error('[AppFolio] Public page fallback failed:', err)
    return getMockListings()
  }
}

// ============================================
// Public: Get all available listings
// ============================================

/**
 * A row from the v0 API `/listings` endpoint — AppFolio's marketing feed. This
 * is the single source of truth for the website: it carries every field we show
 * (title, description, pet policy, amenities, rent, deposit, availability, video)
 * AND the photos (`UnitPhotos`), so no page/detail scraping is needed.
 */
interface V0Listing {
  Id: string
  UnitId?: string
  Address1?: string
  Address2?: string | null
  City?: string
  State?: string
  Zip?: string
  AdvertisedRent?: number | string
  Bedrooms?: number | string
  Bathrooms?: number | string
  SquareFeet?: number | string
  AvailableOn?: string | null
  Deposit?: number | string
  MarketingTitle?: string
  MarketingDescription?: string
  // CatsAllowed is a boolean on this endpoint; DogPolicy is a string enum
  // ("Not Allowed" | "Small Only" | "Large & Small").
  CatsAllowed?: boolean | string | null
  DogPolicy?: string | null
  UnitAmenities?: string[]
  UtilitiesIncluded?: string[]
  UnitPhotos?: { Url?: string; ThumbnailUrl?: string; ContentType?: string }[]
  YouTubeURL?: string | null
  ApplicationURL?: string
  PropertyId?: string
  PropertyType?: string
  PostedToWebsite?: boolean
}

/** Map one `/listings` row to our public AppFolioListing shape. */
function mapApiListing(l: V0Listing, appliances: string[] = []): AppFolioListing {
  const beds = Math.round(parseNumber(l.Bedrooms))
  const baths = parseNumber(l.Bathrooms)
  const sqft = Math.round(parseNumber(l.SquareFeet))
  const rent = parseNumber(l.AdvertisedRent)
  const city = l.City || ''

  // Photos come straight from the API (Url = large image); AppFolio returns the
  // cover photo first, so order is preserved.
  const photos = (l.UnitPhotos || [])
    .map((p) => p.Url)
    .filter((u): u is string => Boolean(u))
    .map((Url, i) => ({ Url, Caption: i === 0 ? 'Primary photo' : undefined }))

  // AppFolio's page shows three feature groups: Amenities, Utilities Included,
  // and Appliances. The `/listings` feed only carries the first two; appliances
  // come from the joined `/units` record. Combine in that order, deduped.
  const amenities = Array.from(
    new Set(
      [...(l.UnitAmenities ?? []), ...(l.UtilitiesIncluded ?? []), ...appliances]
        .map((a) => (a ?? '').trim())
        .filter(Boolean),
    ),
  )

  const description = l.MarketingDescription || ''
  const videoId = extractYouTubeId(l.YouTubeURL)
  const catsAllowed =
    typeof l.CatsAllowed === 'boolean' ? l.CatsAllowed : catsAllowedFromApi(l.CatsAllowed)

  return {
    Id: l.Id,
    Address1: (l.Address1 || '').trim(),
    City: city,
    State: l.State || 'OR',
    Zip: l.Zip || '',
    AdvertisedRent: rent,
    Bedrooms: beds,
    Bathrooms: baths,
    SquareFeet: sqft,
    AvailableOn: l.AvailableOn || '',
    MarketingTitle: l.MarketingTitle?.trim() || `${beds}BR/${baths}BA in ${city}`,
    MarketingDescription: description,
    UnitPhotos: photos,
    UnitAmenities: amenities,
    ApplicationURL: l.ApplicationURL || `${APPFOLIO_PUBLIC_BASE}/listings`,
    CatsAllowed: catsAllowed,
    DogPolicy: dogPolicyFromApi(l.DogPolicy),
    Deposit: parseNumber(l.Deposit) || rent,
    PropertyType: l.PropertyType || undefined,
    PropertyId: l.PropertyId,
    // The listing's `Id` is AppFolio's listable_uid, which is also its
    // detail-page id — keep it so links to AppFolio still resolve.
    AppFolioDetailId: l.Id,
    RentZapURL: extractRentZapUrl(description).rentZapUrl ?? undefined,
    VideoURL: videoId ? youTubeWatchUrl(videoId) : undefined,
  }
}

export async function getListings(forceFresh = false): Promise<AppFolioListing[]> {
  const config = getConfig()
  if (!config) {
    throw new Error('[AppFolio] API credentials are not configured — cannot fetch listings')
  }
  const { clientId, clientSecret, developerId } = config

  // Pull the full marketing feed (paginated), then keep only what's posted to
  // the website. `/listings` caps at 100 rows/page, so we follow next_page_path.
  const all: V0Listing[] = []
  let pageNumber = 1
  while (true) {
    const res = await v0Fetch<V0Listing>(
      '/listings',
      {
        'filters[LastUpdatedAtFrom]': '2020-01-01T00:00:00Z',
        'page[number]': String(pageNumber),
        'page[size]': '1000',
      },
      clientId,
      clientSecret,
      developerId,
      forceFresh,
    )
    const rows = res.data || []
    all.push(...rows)
    if (!res.next_page_path || rows.length === 0) break
    pageNumber++
    if (pageNumber > 50) {
      console.warn('[AppFolio] /listings hit the 50-page safety cap')
      break
    }
  }

  const posted = all.filter((l) => l.PostedToWebsite)
  console.log(`[AppFolio] /listings: ${all.length} total, ${posted.length} posted to website`)

  // Appliances aren't on the /listings feed — join them from /units by unit id
  // (exact match: /listings.UnitId === /units.Id). Pure API, no scraping.
  const units = await fetchAllUnits(clientId, clientSecret, developerId, forceFresh)
  const appliancesByUnit = new Map<string, string[]>()
  for (const u of units) {
    if (u.Id && u.AppliancesIncluded?.length) appliancesByUnit.set(u.Id, u.AppliancesIncluded)
  }

  return posted.map((l) => mapApiListing(l, (l.UnitId && appliancesByUnit.get(l.UnitId)) || []))
}

// ============================================
// Public: Get single listing by ID (live, no cache)
// ============================================

export async function getListingById(id: string): Promise<AppFolioListing | undefined> {
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
  // Optional so reads still work before the `video_url` column is added to
  // web_listings (see scripts/sql/add-video-url-to-web-listings.sql).
  video_url?: string | null
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
    // Derive the RentZap apply link from the stored description so the Apply
    // button works from the cache without any scraping.
    RentZapURL: extractRentZapUrl(row.description).rentZapUrl ?? undefined,
    VideoURL: row.video_url || undefined,
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

    // All fields — photos, video, and the RentZap link (derived in rowToListing
    // from the description) — come from the cache, which the sync populates from
    // the v0 API. No detail-page scraping.
    return rowToListing(data as WebListingRow)
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
