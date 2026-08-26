import { supabaseAdmin } from '@/lib/supabase'
import { getListings, fetchDetailPage, type AppFolioListing } from '@/lib/appfolio'
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

  // 2. For each listing with a detail page ID, fetch all photos (and, from the
  //    same HTML, the marketing video URL if the property has one).
  //    Rate limit: 1 second delay between detail page fetches
  for (const listing of listings) {
    if (listing.AppFolioDetailId) {
      try {
        const { photos, videoUrl } = await fetchDetailPage(listing.AppFolioDetailId, forceFresh)
        if (photos.length > 0) {
          listing.UnitPhotos = photos
        }
        if (videoUrl) {
          listing.VideoURL = videoUrl
        }
      } catch (err) {
        console.warn(`[sync-listings] Failed to fetch detail page for ${listing.Id}:`, err)
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
    video_url: l.VideoURL || null,
    status: 'available',
    deposit: l.Deposit,
    lease_terms: null,
    synced_at: now,
    updated_at: now,
  }))

  // Upsert in batches of 500. `video_url` is a newer column; if it hasn't been
  // added to web_listings yet, Postgres/PostgREST rejects the write with a
  // missing-column error (42703 / PGRST204). Rather than break the whole sync,
  // detect that once, drop the field, and retry without it — videos simply
  // won't be stored until the column exists (see
  // scripts/sql/add-video-url-to-web-listings.sql).
  const BATCH_SIZE = 500
  const isMissingVideoColumn = (err: { code?: string; message?: string }) =>
    err?.code === '42703' ||
    err?.code === 'PGRST204' ||
    /video_url/.test(err?.message ?? '')

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabaseAdmin.from('web_listings').upsert(batch, { onConflict: 'id' })

    if (error) {
      if (isMissingVideoColumn(error)) {
        console.warn(
          '[sync-listings] web_listings.video_url column missing — retrying without it. ' +
            'Run scripts/sql/add-video-url-to-web-listings.sql to enable video badges.',
        )
        const stripped = batch.map((row) => {
          const rest = { ...row }
          delete (rest as { video_url?: unknown }).video_url
          return rest
        })
        const { error: retryError } = await supabaseAdmin
          .from('web_listings')
          .upsert(stripped, { onConflict: 'id' })
        if (retryError) {
          console.error(`[sync-listings] Upsert batch ${i} retry error:`, retryError)
          throw retryError
        }
        continue
      }
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
