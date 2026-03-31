/**
 * Sync Google reviews into the Testimonials collection.
 *
 * Usage:
 *   npx tsx scripts/sync-google-reviews.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

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

async function sync() {
  if (!GOOGLE_API_KEY || !GOOGLE_PLACE_ID) {
    console.error('Missing GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID in .env.local')
    process.exit(1)
  }

  console.log('⭐ Syncing Google reviews...\n')

  const url = `https://places.googleapis.com/v1/places/${GOOGLE_PLACE_ID}`
  const res = await fetch(url, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_API_KEY,
      'X-Goog-FieldMask': 'reviews,rating,userRatingCount',
    },
  })

  if (!res.ok) {
    console.error('Google API error:', res.status, await res.text())
    process.exit(1)
  }

  const data = await res.json()
  console.log(`  Google rating: ${data.rating} (${data.userRatingCount} reviews)\n`)

  const fiveStarReviews: GoogleReview[] = (data.reviews || [])
    .filter((r: GoogleReview) => r.rating === 5 && r.text?.text?.length > 0)

  console.log(`  Found ${fiveStarReviews.length} five-star reviews\n`)

  const payload = await getPayload({ config })
  let created = 0
  let skipped = 0

  for (const review of fiveStarReviews) {
    const reviewId = review.name

    const existing = await payload.find({
      collection: 'testimonials',
      where: { googleReviewId: { equals: reviewId } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      skipped++
      console.log(`  ⏭ Skipped (exists): ${review.authorAttribution.displayName}`)
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
        publishedAt: review.publishTime,
        approved: true,
      },
    })
    created++
    console.log(`  ✓ Imported: ${review.authorAttribution.displayName} (${review.relativePublishTimeDescription})`)
  }

  console.log(`\n✅ Done! ${created} imported, ${skipped} skipped.`)
  process.exit(0)
}

sync().catch((err) => {
  console.error('Sync failed:', err)
  process.exit(1)
})
