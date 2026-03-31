import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const GOOGLE_API_KEY = process.env.GOOGLE_PLACES_API_KEY || ''
const GOOGLE_PLACE_ID = process.env.GOOGLE_PLACE_ID || ''

interface GoogleReview {
  authorAttribution: { displayName: string }
  rating: number
  text: { text: string }
  relativePublishTimeDescription: string
  publishTime: string
  name: string
}

interface PlaceDetailsResponse {
  reviews?: GoogleReview[]
  rating?: number
  userRatingCount?: number
}

/**
 * GET /api/sync-reviews
 *
 * Pulls reviews from Google Places API (New), filters for 5-star,
 * and upserts them into the Testimonials collection.
 *
 * Query params:
 *   ?dry=true   — preview what would be imported without saving
 *
 * Requires env vars:
 *   GOOGLE_PLACES_API_KEY — Google Cloud API key with Places API (New) enabled
 *   GOOGLE_PLACE_ID       — Google Place ID for HDPM
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dryRun = searchParams.get('dry') === 'true'

  if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) {
    return NextResponse.json(
      {
        error: 'Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID env vars',
        setup: {
          step1: 'Create a Google Cloud project at console.cloud.google.com',
          step2: 'Enable "Places API (New)" in APIs & Services',
          step3: 'Create an API key and restrict it to Places API',
          step4: 'Find your Place ID at https://developers.google.com/maps/documentation/places/web-service/place-id',
          step5: 'Add GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID to .env.local',
        },
      },
      { status: 500 },
    )
  }

  try {
    // Fetch place details with reviews from Google Places API (New)
    const url = `https://places.googleapis.com/v1/places/${GOOGLE_PLACE_ID}`
    const res = await fetch(url, {
      headers: {
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask': 'reviews,rating,userRatingCount',
      },
    })

    if (!res.ok) {
      const errorBody = await res.text()
      return NextResponse.json(
        { error: 'Google API request failed', status: res.status, body: errorBody },
        { status: 502 },
      )
    }

    const data: PlaceDetailsResponse = await res.json()

    if (!data.reviews || data.reviews.length === 0) {
      return NextResponse.json({
        message: 'No reviews found',
        placeRating: data.rating,
        totalReviews: data.userRatingCount,
      })
    }

    // Filter for 5-star reviews, take the 10 most recent
    const fiveStarReviews = data.reviews
      .filter((r) => r.rating === 5 && r.text?.text?.length > 0)
      .slice(0, 10)

    if (dryRun) {
      return NextResponse.json({
        message: 'Dry run — no changes saved',
        placeRating: data.rating,
        totalReviews: data.userRatingCount,
        fiveStarFound: fiveStarReviews.length,
        reviews: fiveStarReviews.map((r) => ({
          author: r.authorAttribution.displayName,
          rating: r.rating,
          text: r.text.text,
          publishTime: r.publishTime,
        })),
      })
    }

    // Upsert into Testimonials collection
    const payload = await getPayload({ config })
    let created = 0
    let skipped = 0

    for (const review of fiveStarReviews) {
      const reviewId = review.name || `${review.authorAttribution.displayName}-${review.publishTime}`

      // Check if already imported
      const existing = await payload.find({
        collection: 'testimonials',
        where: { googleReviewId: { equals: reviewId } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        skipped++
        continue
      }

      await payload.create({
        collection: 'testimonials',
        data: {
          author: review.authorAttribution.displayName,
          text: review.text.text,
          rating: review.rating,
          source: 'google',
          googleReviewId: reviewId,
          publishedAt: review.publishTime || new Date().toISOString(),
          approved: true,
        },
      })
      created++
    }

    return NextResponse.json({
      message: `Sync complete: ${created} new reviews imported, ${skipped} duplicates skipped`,
      placeRating: data.rating,
      totalReviews: data.userRatingCount,
      imported: created,
      skipped,
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Sync failed', details: String(err) },
      { status: 500 },
    )
  }
}
