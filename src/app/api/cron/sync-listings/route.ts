import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { getListings, fetchDetailPagePhotos, type AppFolioListing } from '@/lib/appfolio'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — large dataset

const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/sync-listings
 *
 * Fetches all available listings from AppFolio (v0 API + public page scraping)
 * and upserts them into the Supabase `web_listings` cache table.
 * Removes any listings that are no longer returned by AppFolio (rented / taken off market).
 *
 * For each listing with a detail page ID, fetches all photos from the
 * public detail page to store permanent CDN image URLs.
 *
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const startTime = Date.now()

    // 1. Fetch all listings from AppFolio (v0 API + public page CDN images)
    const listings = await getListings()
    if (!listings.length) {
      return NextResponse.json(
        { error: 'No listings returned from AppFolio — skipping sync to avoid data loss' },
        { status: 500 },
      )
    }

    // 2. For each listing with a detail page ID, fetch all photos
    //    Rate limit: 1 second delay between detail page fetches
    for (const listing of listings) {
      if (listing.AppFolioDetailId) {
        try {
          const detailPhotos = await fetchDetailPagePhotos(listing.AppFolioDetailId)
          if (detailPhotos.length > 0) {
            listing.UnitPhotos = detailPhotos
          }
        } catch (err) {
          console.warn(`[sync-listings] Failed to fetch detail photos for ${listing.Id}:`, err)
        }
        // Rate limit: 1 second delay between detail page fetches
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
      pet_friendly: l.CatsAllowed || l.DogPolicy.toLowerCase() !== 'no dogs',
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
      const { error } = await supabaseAdmin
        .from('web_listings')
        .upsert(batch, { onConflict: 'id' })

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

    return NextResponse.json({
      ok: true,
      synced: rows.length,
      removed: removedIds.length,
      elapsed_ms: elapsed,
    })
  } catch (err) {
    console.error('[sync-listings] Sync failed:', err)
    return NextResponse.json(
      { error: 'Sync failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
