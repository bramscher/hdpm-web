/**
 * Add owner-intent internal links to the three existing Redmond blog posts,
 * pointing at the canonical /market-areas/redmond page with exact-match anchor
 * text ("Redmond property management") plus an /owners CTA. This pushes
 * internal-link equity onto the Redmond money page, which ranks (~pos 6) but
 * was leaking clicks. Idempotent: skips a post that already links to the page.
 *
 * Usage: npx tsx scripts/add-redmond-internal-links.ts
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
  'how-to-rent-redmond': [
    textNode('Prefer to hand the whole process off? See how our '),
    linkNode('/market-areas/redmond', 'Redmond property management'),
    textNode(' team handles marketing, screening, and leasing for local owners — or '),
    linkNode('/owners', 'get a free rental analysis'),
    textNode('.'),
  ],
  'real-estate-investing-redmond': [
    textNode('Once your Redmond investment is ready to rent, professional '),
    linkNode('/market-areas/redmond', 'Redmond property management'),
    textNode(' protects the return. Learn '),
    linkNode('/owners', 'how we work with owners and investors'),
    textNode('.'),
  ],
  'buying-investment-property-redmond': [
    textNode('Already closed on a Redmond rental? Our local '),
    linkNode('/market-areas/redmond', 'Redmond property management'),
    textNode(' services take it from there. Start with a free '),
    linkNode('/owners', 'owner rental analysis'),
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
    if (JSON.stringify(body).includes('/market-areas/redmond')) {
      console.log(`OUT ✓  ${slug}: already links to Redmond page — skipped`)
      continue
    }
    body.root.children.push(paragraph(closer))
    await payload.update({
      collection: 'posts',
      id: doc.id as number,
      data: { body } as never,
    })
    console.log(`OUT ✏️  ${slug}: appended Redmond + owners internal links`)
  }

  console.log('OUT ✅ Done.')
  process.exit(0)
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(1)
})
