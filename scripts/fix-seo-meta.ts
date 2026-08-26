/**
 * One-off SEO metadata cleanup (Aug 2026), idempotent and safe to re-run.
 *
 * Two stored-data problems the render-time fixes can't fully reach:
 *
 * 1. Double brand: the root layout applies a `%s | High Desert Property
 *    Management` title template, but some stored `meta.title` / `seoTitle`
 *    values (from older applied SEO suggestions) already end in
 *    "| High Desert PM" — so the brand rendered twice. Strip the suffix; the
 *    template re-adds it. (Render also strips defensively via
 *    src/lib/seo.ts#stripBrandSuffix — this cleans the source of truth.)
 * 2. Stale founding year: a few stored descriptions still say "since 2011"
 *    (or "since 2003"). The company has served Central Oregon since 1999.
 *
 * Dry-run by default (prints proposed changes). Set APPLY=1 to write.
 * Usage:
 *   npx tsx scripts/fix-seo-meta.ts            # preview
 *   APPLY=1 npx tsx scripts/fix-seo-meta.ts    # apply
 *
 * PREREQUISITE: connecting locally triggers Payload's dev schema-push, which
 * currently FAILS if any `seo-suggestions` row still has the removed
 * `status = 'approved'` value (dropped in #34) — the enum can't be reconciled
 * while a row uses it. Clear those first (set them to Pending/Applied in the
 * admin) or this script won't be able to connect. Prod runtime is unaffected
 * (it doesn't push); this only blocks local tooling.
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const APPLY = process.env.APPLY === '1'

// Keep in sync with stripBrandSuffix() in src/lib/seo.ts.
const BRAND_SUFFIX = /\s*[|\-–—]\s*High Desert(?:\s+(?:PM|Property Management))?\.?\s*$/i
const STALE_YEAR = /\bsince (?:2011|2003)\b/gi

const fixTitle = (v?: string | null) => (v ? v.replace(BRAND_SUFFIX, '').trim() : v)
const fixDesc = (v?: string | null) => (v ? v.replace(STALE_YEAR, 'since 1999') : v)

async function main() {
  const payload = await getPayload({ config })
  let changed = 0

  // pages + posts store SEO via the seo-plugin `meta` group.
  for (const collection of ['pages', 'posts'] as const) {
    const { docs } = await payload.find({ collection, limit: 500, depth: 0 })
    for (const rawDoc of docs) {
      const doc = rawDoc as unknown as {
        id: number | string
        slug?: string | null
        meta?: { title?: string | null; description?: string | null; [k: string]: unknown }
      }
      const meta = doc.meta ?? {}
      const newTitle = fixTitle(meta.title)
      const newDesc = fixDesc(meta.description)
      const titleChanged = !!meta.title && newTitle !== meta.title
      const descChanged = !!meta.description && newDesc !== meta.description
      if (!titleChanged && !descChanged) continue

      changed++
      console.log(`\n${collection}#${doc.id} (${String(doc.slug)})`)
      if (titleChanged) console.log(`  title: "${meta.title}" -> "${newTitle}"`)
      if (descChanged) console.log(`  desc:  "${meta.description}" -> "${newDesc}"`)
      if (APPLY) {
        await payload.update({
          collection,
          id: doc.id,
          data: { meta: { ...meta, title: newTitle, description: newDesc } },
        })
      }
    }
  }

  // market-areas use flat seoTitle/seoDescription.
  const { docs: areas } = await payload.find({
    collection: 'market-areas',
    limit: 500,
    depth: 0,
  })
  for (const area of areas) {
    const a = area as unknown as {
      id: number | string
      slug?: string | null
      seoTitle?: string | null
      seoDescription?: string | null
    }
    const newTitle = fixTitle(a.seoTitle)
    const newDesc = fixDesc(a.seoDescription)
    const titleChanged = !!a.seoTitle && newTitle !== a.seoTitle
    const descChanged = !!a.seoDescription && newDesc !== a.seoDescription
    if (!titleChanged && !descChanged) continue

    changed++
    console.log(`\nmarket-areas#${a.id} (${String(a.slug)})`)
    if (titleChanged) console.log(`  seoTitle: "${a.seoTitle}" -> "${newTitle}"`)
    if (descChanged) console.log(`  seoDescription: "${a.seoDescription}" -> "${newDesc}"`)
    if (APPLY) {
      await payload.update({
        collection: 'market-areas',
        id: a.id,
        data: { seoTitle: newTitle, seoDescription: newDesc },
      })
    }
  }

  console.log(
    `\n${APPLY ? 'Applied' : 'Would change'} ${changed} doc(s).` +
      (APPLY ? '' : '  Re-run with APPLY=1 to write.'),
  )
  process.exit(0)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
