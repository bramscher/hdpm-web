import { supabaseAdmin } from '@/lib/supabase'
import { getListings, fetchDetailPagePhotos, type AppFolioListing } from '@/lib/appfolio'
import { isListingPetFriendly } from '@/lib/listing-utils'

export interface SyncListingsResult {
  ok: true
  synced: number
  removed: number
  elapsed_ms: number
  fresh: boolean
  message: string
}

/**
 * Fetch all available listings from AppFolio (v0 API + public page scraping)
 * and upsert them into the Supabase `web_listings` cache table, deleting any
 * listings that are no longer returned by AppFolio (rented / off market).
 *
 * `forceFresh` bypasses the 15-minute ISR cache so the pull genuinely re-reads
 * AppFolio (used by the manual admin "Refresh from AppFolio" sync); the
 * scheduled cron leaves it false to stay cache-cheap.
 *
 * Shared by both the scheduled cron route and the admin automations route so
 * the manual sync runs in-process — no internal HTTP round-trip / CRON_SECRET
 * handshake that can fail behind redirects or a trailing-newline secret.
 *
 * Throws on failure (empty result, Supabase error); callers map to a response.
 */
export async function runListingsSync(forceFresh = false): Promise<SyncListingsResult> {
  const startTime = Date.now()

  // 1. Fetch all listings from AppFolio (v0 API + public page CDN images)
  const listings = await getListings(forceFresh)
  if (!listings.length) {
    throw new Error('No listings returned from AppFolio — skipping sync to avoid data loss')
  }

  // 2. For each listing with a detail page ID, fetch all photos
  //    Rate limit: 1 second delay between detail page fetches
  for (const listing of listings) {
    if (listing.AppFolioDetailId) {
      try {
        const detailPhotos = await fetchDetailPagePhotos(listing.AppFolioDetailId, forceFresh)
        if (detailPhotos.length > 0) {
          listing.UnitPhotos = detailPhotos
        }
      } catch (err) {
        console.warn(`[sync-listings] Failed to fetch detail photos for ${listing.Id}:`, err)
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
  }

  const now = new Date().toISOString()

  // 3. Upsert listings into Supabase
  const rows = listings.map((l: AppFolioListing) => ({
    id: l.Id,
    address: l.Address1,
    city: l.City,
    state: l.State,
    zip: l.Zip,
    rent: l.AdvertisedRent,
    beds: l.Bedrooms,
    baths: l.Bathrooms,
    sqft: l.SquareFeet,
    description: l.MarketingDescription,
    marketing_title: l.MarketingTitle,
    available_date: l.AvailableOn,
    pet_friendly: isListingPetFriendly(l),
    cats_allowed: l.CatsAllowed,
    dog_policy: l.DogPolicy,
    photos: l.UnitPhotos,
    amenities: l.UnitAmenities,
    application_url: l.ApplicationURL,
    property_type: l.PropertyType || null,
    property_id: l.PropertyId || null,
    appfolio_detail_id: l.AppFolioDetailId || null,
    status: 'available',
    deposit: l.Deposit,
    lease_terms: null,
    synced_at: now,
    updated_at: now,
  }))

  // Upsert in batches of 500
  const BATCH_SIZE = 500
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabaseAdmin.from('web_listings').upsert(batch, { onConflict: 'id' })

    if (error) {
      console.error(`[sync-listings] Upsert batch ${i} error:`, error)
      throw error
    }
  }

  // 4. Delete listings no longer in AppFolio
  const activeIds = listings.map((l) => l.Id)
  const { data: existingRows, error: fetchError } = await supabaseAdmin
    .from('web_listings')
    .select('id')

  if (fetchError) {
    console.error('[sync-listings] Fetch existing IDs error:', fetchError)
    throw fetchError
  }

  const existingIds = (existingRows || []).map((r: { id: string }) => r.id)
  const removedIds = existingIds.filter((id: string) => !activeIds.includes(id))

  if (removedIds.length > 0) {
    const { error: deleteError } = await supabaseAdmin
      .from('web_listings')
      .delete()
      .in('id', removedIds)

    if (deleteError) {
      console.error('[sync-listings] Delete removed listings error:', deleteError)
      throw deleteError
    }
  }

  const elapsed = Date.now() - startTime

  console.log(
    `[sync-listings] Synced ${rows.length} listings, removed ${removedIds.length} in ${elapsed}ms`,
  )

  return {
    ok: true,
    synced: rows.length,
    removed: removedIds.length,
    elapsed_ms: elapsed,
    fresh: forceFresh,
    message: `${forceFresh ? 'Fresh pull: synced' : 'Synced'} ${rows.length} listings${
      removedIds.length ? `, removed ${removedIds.length}` : ''
    }`,
  }
}
