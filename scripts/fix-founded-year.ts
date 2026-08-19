/**
 * Data migration: correct the founding year in live CMS content from 2011 -> 1999.
 *
 * The code + seed scripts were already updated, but content that was seeded into
 * the DB (home hero badge, About story heading, existing blog article bodies)
 * still renders "since 2011" from Postgres. This rewrites those in place.
 *
 * Safety:
 *  - Only rewrites the exact phrase "since 2011" / "Since 2011" (word-boundary),
 *    so an unrelated "2011" (a stat, a real date) is never touched.
 *  - Fetches at depth:0 so relationship/upload fields stay as IDs (safe to write back).
 *  - DRY RUN by default — prints every change it *would* make. Pass --apply to write.
 *
 * Usage:
 *   npx tsx scripts/fix-founded-year.ts            # dry run (no writes)
 *   npx tsx scripts/fix-founded-year.ts --apply    # actually update the DB
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const APPLY = process.argv.includes('--apply')

// Only "since 2011" / "Since 2011" (word boundary after the year).
const YEAR_RE = /([Ss]ince )2011\b/g
const fixString = (s: string) => s.replace(YEAR_RE, (_m, p1) => `${p1}1999`)

const COLLECTIONS = ['pages', 'posts'] as const

type Change = { path: string; before: string; after: string }

/** Recursively rewrite matching strings, recording each change with its field path. */
function transform(value: unknown, path: string, changes: Change[]): unknown {
  if (typeof value === 'string') {
    const next = fixString(value)
    if (next !== value) changes.push({ path, before: value, after: next })
    return next
  }
  if (Array.isArray(value)) {
    return value.map((v, i) => transform(v, `${path}[${i}]`, changes))
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = transform(v, path ? `${path}.${k}` : k, changes)
    }
    return out
  }
  return value
}

async function run() {
  const payload = await getPayload({ config })
  console.log(`\n=== fix-founded-year (2011 -> 1999) — ${APPLY ? 'APPLY (writing)' : 'DRY RUN'} ===\n`)

  let docsChanged = 0
  let fieldsChanged = 0

  for (const collection of COLLECTIONS) {
    const { docs } = await payload.find({
      collection,
      depth: 0,
      limit: 1000,
      pagination: false,
      // include drafts too, so unpublished content is fixed as well
      draft: true,
      overrideAccess: true,
    })

    for (const doc of docs as unknown as Array<Record<string, unknown>>) {
      const changes: Change[] = []
      // Don't rewrite system fields
      const { id, createdAt, updatedAt, ...rest } = doc
      const transformed = transform(rest, '', changes) as Record<string, unknown>

      if (changes.length === 0) continue

      docsChanged++
      fieldsChanged += changes.length
      const label = (doc.slug as string) || (doc.title as string) || String(id)
      console.log(`• ${collection} "${label}" (id ${id}) — ${changes.length} change(s):`)
      for (const c of changes) {
        const snip = (s: string) => (s.length > 90 ? s.slice(0, 90) + '…' : s)
        console.log(`    - ${c.path}`)
        console.log(`        - ${snip(c.before)}`)
        console.log(`        + ${snip(c.after)}`)
      }

      if (APPLY) {
        await payload.update({
          collection,
          id: id as string,
          data: transformed,
          depth: 0,
          overrideAccess: true,
        })
        console.log(`    ✓ updated`)
      }
    }
  }

  console.log(
    `\n${APPLY ? 'Updated' : 'Would update'} ${fieldsChanged} field(s) across ${docsChanged} doc(s).`,
  )
  if (!APPLY && docsChanged > 0) {
    console.log('Re-run with --apply to write these changes.')
  }
  process.exit(0)
}

run().catch((err) => {
  console.error('fix-founded-year failed:', err)
  process.exit(1)
})
