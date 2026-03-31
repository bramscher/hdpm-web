/**
 * Redate and reorder blog posts: interleave tech and general posts,
 * starting November 1, 2025.
 *
 * Usage:
 *   npx tsx scripts/redate-blogs.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// Interleaved order: alternates general and tech posts in a natural flow.
// Starts Nov 1 2025, roughly one post every 7-8 days through March 2026.
const POST_SCHEDULE: { slug: string; date: string }[] = [
  // Nov 2025 — launch month, mix of foundational content
  { slug: 'neighborhood-guide-bend-oregon-where-to-rent-2026', date: '2025-11-01T09:00:00.000Z' },
  { slug: 'ai-maintenance-triage-24-7-rental-protection', date: '2025-11-08T09:00:00.000Z' },
  { slug: 'tenant-move-in-checklist-central-oregon', date: '2025-11-15T09:00:00.000Z' },
  { slug: 'smart-home-technology-rental-properties-owners-guide', date: '2025-11-22T09:00:00.000Z' },

  // Dec 2025 — winter focus + tech
  { slug: 'winter-property-maintenance-high-desert-owners-guide', date: '2025-12-01T09:00:00.000Z' },
  { slug: 'ai-after-hours-support-property-management', date: '2025-12-08T09:00:00.000Z' },
  { slug: 'understanding-oregon-rental-laws-tenant-guide', date: '2025-12-15T09:00:00.000Z' },
  { slug: 'ai-real-time-owner-reporting-investment-visibility', date: '2025-12-22T09:00:00.000Z' },

  // Jan 2026 — new year, investment + tech
  { slug: 'why-hire-property-manager-central-oregon', date: '2026-01-05T09:00:00.000Z' },
  { slug: 'ai-powered-showing-scheduling-fill-vacancies-faster', date: '2026-01-13T09:00:00.000Z' },
  { slug: 'maximize-rental-income-central-oregon-investment-property', date: '2026-01-20T09:00:00.000Z' },
  { slug: 'ai-self-guided-tours-smart-access-rental-showings', date: '2026-01-27T09:00:00.000Z' },

  // Feb 2026 — lifestyle + tech
  { slug: 'cost-of-living-central-oregon-bend-redmond-sisters', date: '2026-02-03T09:00:00.000Z' },
  { slug: 'ai-predictive-maintenance-prevent-problems-before-they-start', date: '2026-02-10T09:00:00.000Z' },
  { slug: 'pet-policies-rental-properties-oregon-landlords', date: '2026-02-17T09:00:00.000Z' },
  { slug: 'ai-transforming-tenant-experience-central-oregon', date: '2026-02-24T09:00:00.000Z' },

  // Mar 2026 — fire season prep + innovation wrap
  { slug: 'preparing-rental-property-wildfire-season-central-oregon', date: '2026-03-03T09:00:00.000Z' },
  { slug: 'hdpm-central-oregon-most-innovative-property-management', date: '2026-03-10T09:00:00.000Z' },
  { slug: '15-things-to-do-central-oregon-local-area-guide', date: '2026-03-17T09:00:00.000Z' },
  { slug: 'future-of-property-management-ai-automation-rental', date: '2026-03-24T09:00:00.000Z' },
]

async function redateBlogs() {
  console.log('📅 Redating and reordering blog posts...\n')

  const payload = await getPayload({ config })

  let updated = 0

  for (const entry of POST_SCHEDULE) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: entry.slug } },
      limit: 1,
      depth: 0,
    })

    if (docs.length === 0) {
      console.log(`  ⚠ Not found: ${entry.slug}`)
      continue
    }

    const post = docs[0]
    await payload.update({
      collection: 'posts',
      id: post.id,
      data: {
        publishedAt: entry.date,
      },
    })

    const dateStr = new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    console.log(`  ✓ ${dateStr}  ${post.title}`)
    updated++
  }

  console.log(`\n✅ Done! Redated ${updated} posts.`)
  process.exit(0)
}

redateBlogs().catch((err) => {
  console.error('Script failed:', err)
  process.exit(1)
})
