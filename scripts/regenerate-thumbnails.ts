/**
 * Re-processes all media records to generate missing size variants
 * (thumbnail, card, hero) and upload them via the Supabase storage adapter.
 *
 * Usage: npx tsx scripts/regenerate-thumbnails.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const BUCKET = 'media'

const SIZES = [
  { name: 'thumbnail', width: 400, height: 300 },
  { name: 'card', width: 768, height: 512 },
  { name: 'hero', width: 1920, height: 1080 },
]

async function main() {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'media',
    limit: 200,
    depth: 0,
  })

  console.log(`Found ${docs.length} media records\n`)

  for (const doc of docs) {
    const filename = doc.filename
    if (!filename) {
      console.log(`  ⚠ Skipping id=${doc.id} — no filename`)
      continue
    }

    console.log(`📷 ${filename}`)

    // Download the original from Supabase
    const { data: blob, error: dlError } = await supabase.storage.from(BUCKET).download(filename)
    if (dlError || !blob) {
      console.log(`  ✗ Download failed: ${dlError?.message || 'no data'}`)
      continue
    }

    const buffer = Buffer.from(await blob.arrayBuffer())

    // Generate and upload each size variant (always overwrite to fix mismatches)
    for (const size of SIZES) {
      const ext = filename.match(/\.[^.]+$/)?.[0] || '.jpg'
      const baseName = filename.replace(/\.[^.]+$/, '')
      const sizeFilename = `${baseName}-${size.width}x${size.height}${ext}`

      try {
        const resized = await sharp(buffer)
          .resize(size.width, size.height, { fit: 'cover', position: 'centre' })
          .jpeg({ quality: 80 })
          .toBuffer()

        const { error: upError } = await supabase.storage.from(BUCKET).upload(sizeFilename, resized, {
          contentType: 'image/jpeg',
          upsert: true,
        })

        if (upError) {
          console.log(`  ✗ ${size.name}: ${upError.message}`)
        } else {
          console.log(`  ✓ ${size.name} (${(resized.length / 1024).toFixed(0)} KB)`)
        }
      } catch (err) {
        console.log(`  ✗ ${size.name}: ${err instanceof Error ? err.message : err}`)
      }
    }

    // Update the Payload record with correct size URLs
    try {
      const ext = filename.match(/\.[^.]+$/)?.[0] || '.jpg'
      const baseName = filename.replace(/\.[^.]+$/, '')

      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {
          sizes: {
            thumbnail: {
              filename: `${baseName}-400x300${ext}`,
              width: 400,
              height: 300,
              mimeType: 'image/jpeg',
            },
            card: {
              filename: `${baseName}-768x512${ext}`,
              width: 768,
              height: 512,
              mimeType: 'image/jpeg',
            },
            hero: {
              filename: `${baseName}-1920x1080${ext}`,
              width: 1920,
              height: 1080,
              mimeType: 'image/jpeg',
            },
          },
        } as Record<string, unknown>,
      })
      console.log(`  ✓ DB updated`)
    } catch (err) {
      console.log(`  ✗ DB update: ${err instanceof Error ? err.message : err}`)
    }
  }

  console.log('\n✅ Done')
  process.exit(0)
}

main().catch(console.error)
