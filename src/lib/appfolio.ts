/**
 * AppFolio Integration for HDPM Website
 *
 * Listings are fed 100% from the v0 API `/listings` marketing feed (title,
 * description, pet policy, amenities, rent, deposit, availability, video, and
 * photos), with appliances joined from `/units`. No HTML scraping.
 *
 * API base: https://api.appfolio.com/api/v0
 *
 * Required env vars:
 *   APPFOLIO_CLIENT_ID
 *   APPFOLIO_CLIENT_SECRET
 *   APPFOLIO_DEVELOPER_ID
 */

import {
  catsAllowedFromApi,
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
  // Unique RentZap application link for this listing, extracted from the
  // marketing description ("APPLY NOW: <url>"). Undefined if none.
  RentZapURL?: string
  // YouTube video URL for the property tour, from the API's YouTubeURL field
  // (AppFolio's "Marketing Video"). Undefined if none.
  VideoURL?: string
}

// ============================================
// Config
// ============================================

const APPFOLIO_V0_BASE = 'https://api.appfolio.com/api/v0'
const APPFOLIO_PUBLIC_BASE = 'https://highdesertpm.appfolio.com'

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
// Fetch freshness
// ============================================

/** Default ISR window for AppFolio fetches (15 minutes). */
const LISTINGS_REVALIDATE = 900

/**
 * Build the Next.js caching options for an AppFolio fetch. Scheduled reads use
 * the 15-minute ISR cache; a manual "Sync Now" passes forceFresh to bypass it.
 */
function freshnessOpts(forceFresh?: boolean): RequestInit {
  return forceFresh ? { cache: 'no-store' } : { next: { revalidate: LISTINGS_REVALIDATE } }
}

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
// Fetch all units (paginated) — used only to join AppliancesIncluded onto the
// /listings feed by unit id (the /listings endpoint omits appliances).
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
