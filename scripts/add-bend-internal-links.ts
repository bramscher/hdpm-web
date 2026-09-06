/**
 * Bend counterpart to add-redmond-internal-links.ts. Appends an owner-intent
 * closing paragraph to the Bend blog posts, linking the canonical
 * /market-areas/bend page with exact-match anchor text ("Bend property
 * management") plus an /owners CTA — pushing internal-link equity onto the Bend
 * money page. The two strongest Bend posts (neighborhood guide, cost-of-living)
 * previously linked to it zero times. Idempotent: skips a post that already
 * links to /market-areas/bend.
 *
 * Usage: npx tsx scripts/add-bend-internal-links.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const textNode = (text: string) => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const linkNode = (url: string, text: string) => ({
  type: 'link',
  version: 3,
  fields: { linkType: 'custom', url, newTab: false },
  direction: 'ltr',
  format: '',
  indent: 0,
  children: [textNode(text)],
})

// One tailored closing paragraph per post so the added block is not boilerplate.
const CLOSERS: Record<string, Array<Record<string, unknown>>> = {
  'neighborhood-guide-bend-oregon-where-to-rent-2026': [
    textNode('Own a rental in one of these neighborhoods? Our local '),
    linkNode('/market-areas/bend', 'Bend property management'),
    textNode(' team handles marketing, screening, and leasing so you don’t have to — start with a free '),
    linkNode('/owners', 'rental analysis'),
    textNode('.'),
  ],
  'cost-of-living-central-oregon-bend-redmond-sisters': [
    textNode('Weighing the numbers on a Bend investment property? Professional '),
    linkNode('/market-areas/bend', 'Bend property management'),
    textNode(' protects your return and keeps it rented. See '),
    linkNode('/owners', 'how we work with owners'),
    textNode('.'),
  ],
  'how-to-choose-property-management-company-bend': [
    textNode('Ready to compare? Learn how our '),
    linkNode('/market-areas/bend', 'Bend property management'),
    textNode(' services stack up, then request a free '),
    linkNode('/owners', 'owner rental analysis'),
    textNode('.'),
  ],
  'property-management-cost-bend-oregon': [
    textNode('Want a straight answer on your property? Our '),
    linkNode('/market-areas/bend', 'Bend property management'),
    textNode(' team will quote it — get a free '),
    linkNode('/owners', 'rental analysis'),
    textNode('.'),
  ],
}

const paragraph = (children: Array<Record<string, unknown>>) => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  children,
})

async function main() {
  const payload = await getPayload({ config })

  for (const [slug, closer] of Object.entries(CLOSERS)) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: slug } },
      limit: 1,
      depth: 0,
    })
    const doc = docs[0] as unknown as Record<string, unknown> | undefined
    if (!doc) {
      console.log(`OUT ⚠️  ${slug}: not found — skipped`)
      continue
    }
    const body = doc.body as { root: { children: Array<Record<string, unknown>> } }
    if (JSON.stringify(body).includes('/market-areas/bend')) {
      console.log(`OUT ✓  ${slug}: already links to Bend page — skipped`)
      continue
    }
    body.root.children.push(paragraph(closer))
    await payload.update({
      collection: 'posts',
      id: doc.id as number,
      data: { body } as never,
    })
    console.log(`OUT ✏️  ${slug}: appended Bend + owners internal links`)
  }

  console.log('OUT ✅ Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(1)
})
