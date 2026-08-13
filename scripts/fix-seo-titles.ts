/**
 * One-off SEO fix (Aug 2026), safe to re-run (idempotent):
 *
 * 1. The root layout applies a `%s | High Desert Property Management` title
 *    template. Several market-area `seoTitle` values already included that
 *    brand suffix, so titles rendered with the brand DOUBLED. Strip the suffix
 *    to the clean exact-match form; the template re-adds the brand.
 * 2. The /owners page `meta.title` was "Redmond Property Management for Owners"
 *    — it cannibalized /market-areas/redmond for Redmond owner queries. Retarget
 *    it to a region-wide owner title so the dedicated Redmond page can rank.
 *
 * Usage: npx tsx scripts/fix-seo-titles.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// slug -> clean seoTitle WITHOUT the brand suffix (template adds it)
const MARKET_AREA_TITLES: Record<string, string> = {
  redmond: 'Redmond Property Management',
  bend: 'Bend Property Management',
  sisters: 'Sisters Property Management',
  prineville: 'Prineville Property Management',
}

const OWNERS_META = {
  title: 'Property Management for Owners in Central Oregon',
  description:
    'Full-service property management for rental owners and investors in Bend, Redmond, Sisters, and Central Oregon — leasing, tenant screening, maintenance, rent collection, and owner reporting. Get a free rental analysis.',
}

async function main() {
  const payload = await getPayload({ config })

  console.log('\n=== Market-area seoTitle fixes ===')
  for (const [slug, seoTitle] of Object.entries(MARKET_AREA_TITLES)) {
    const { docs } = await payload.find({
      collection: 'market-areas',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = docs[0] as unknown as Record<string, unknown> | undefined
    if (!doc) {
      console.log(`  ⚠️  ${slug}: not found — skipped`)
      continue
    }
    if (doc.seoTitle === seoTitle) {
      console.log(`  ✓  ${slug}: already "${seoTitle}"`)
      continue
    }
    console.log(`  ✏️  ${slug}: "${doc.seoTitle}" → "${seoTitle}"`)
    await payload.update({
      collection: 'market-areas',
      id: doc.id as number,
      data: { seoTitle } as never,
    })
  }

  console.log('\n=== /owners meta fix ===')
  const { docs: ownerDocs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: 'owners' } },
    limit: 1,
  })
  const owners = ownerDocs[0] as unknown as Record<string, unknown> | undefined
  if (!owners) {
    console.log('  ⚠️  owners page not found — skipped')
  } else {
    const meta = (owners.meta as Record<string, unknown>) ?? {}
    console.log(`  old title: ${meta.title ?? '(none)'}`)
    console.log(`  old desc : ${(meta.description as string)?.slice(0, 90) ?? '(none)'}`)
    await payload.update({
      collection: 'pages',
      id: owners.id as number,
      data: { meta: { ...meta, ...OWNERS_META } } as never,
    })
    console.log(`  ✏️  new title: ${OWNERS_META.title}`)
  }

  console.log('\n✅ Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
