/**
 * Migrates Payload media URLs from local /media/ paths to Supabase Storage public URLs.
 *
 * Usage:
 *   npx tsx scripts/migrate-media-to-supabase.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sywffgwizbxisalwmxib.supabase.co'
const STORAGE_BASE = `${SUPABASE_URL}/storage/v1/object/public/media`

async function migrate() {
  console.log('🔄 Migrating media URLs to Supabase Storage...\n')

  const payload = await getPayload({ config })

  const { docs: allMedia } = await payload.find({
    collection: 'media',
    limit: 100,
    depth: 0,
  })

  console.log(`Found ${allMedia.length} media records\n`)

  for (const media of allMedia) {
    const filename = media.filename
    if (!filename) {
      console.log(`  ⏭ Skipping media ${media.id} (no filename)`)
      continue
    }

    // Build the new public URL
    const newUrl = `${STORAGE_BASE}/${filename}`

    // Build updated sizes
    const updatedSizes: Record<string, unknown> = {}
    const sizes = media.sizes as Record<string, { filename?: string; url?: string; width?: number; height?: number; mimeType?: string; filesize?: number }> | undefined
    if (sizes) {
      for (const [sizeName, sizeData] of Object.entries(sizes)) {
        if (sizeData?.filename) {
          updatedSizes[sizeName] = {
            ...sizeData,
            url: `${STORAGE_BASE}/${sizeData.filename}`,
          }
        } else {
          updatedSizes[sizeName] = sizeData
        }
      }
    }

    // Update the record directly in the database
    await payload.update({
      collection: 'media',
      id: media.id,
      data: {
        url: newUrl,
        ...(Object.keys(updatedSizes).length > 0 ? { sizes: updatedSizes } : {}),
      } as never,
    })

    console.log(`  ✓ ${filename} → ${newUrl}`)
  }

  console.log('\n✅ Migration complete!')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
