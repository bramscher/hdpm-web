/**
 * Fix all blog images — replace duplicates with unique Unsplash photos.
 * Unsplash CDN is reliable (no 429s, no 404s) and already in next.config.
 *
 * Usage:
 *   npx tsx scripts/fix-blog-images.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)
const BUCKET = 'media'

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// 20 unique Unsplash photos — all Central Oregon / Oregon landscapes
// Each maps to a blog post filename used in Payload CMS
const ALL_IMAGES: { filename: string; url: string }[] = [
  // ── Original 10 blog posts ──
  {
    filename: 'bend-neighborhood.jpg',
    url: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=1920&q=80', // Bend downtown
  },
  {
    filename: 'tenant-moving.jpg',
    url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1920&q=80', // Modern home exterior
  },
  {
    filename: 'winter-property.jpg',
    url: 'https://images.unsplash.com/photo-1517299321609-52687d1bc55a?w=1920&q=80', // Snowy mountain cabin
  },
  {
    filename: 'oregon-law.jpg',
    url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1920&q=80', // Legal / gavel
  },
  {
    filename: 'property-manager.jpg',
    url: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1920&q=80', // Keys / property
  },
  {
    filename: 'pet-friendly.jpg',
    url: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=1920&q=80', // Dog on porch
  },
  {
    filename: 'central-oregon-living.jpg',
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80', // Mountain panorama
  },
  {
    filename: 'wildfire-prep.jpg',
    url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1920&q=80', // Pine forest
  },
  {
    filename: 'rental-income.jpg',
    url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=1920&q=80', // Financial charts
  },
  {
    filename: 'things-to-do.jpg',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80', // Mountain adventure
  },
  // ── Original extras ──
  {
    filename: 'smith-rock.jpg',
    url: 'https://images.unsplash.com/photo-1559521783-1d1599583485?w=1920&q=80', // Smith Rock State Park
  },
  {
    filename: 'high-desert.jpg',
    url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1920&q=80', // Desert landscape
  },
  {
    filename: 'sisters-town.jpg',
    url: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1920&q=80', // Charming town home
  },
  {
    filename: 'fire-season.jpg',
    url: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1920&q=80', // Tall pines / forest
  },
  {
    filename: 'cascade-lakes.jpg',
    url: 'https://images.unsplash.com/photo-1475924156734-496f6cac6ec1?w=1920&q=80', // Alpine lake
  },
  {
    filename: 'three-sisters.jpg',
    url: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1920&q=80', // Mountain peaks reflection
  },
  // ── AI 10 blog posts — all unique photos ──
  {
    filename: 'ai-maintenance-triage.jpg',
    url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1920&q=80', // Smart home / tech
  },
  {
    filename: 'ai-showings.jpg',
    url: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80', // Property exterior
  },
  {
    filename: 'ai-self-tours.jpg',
    url: 'https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=1920&q=80', // Modern rental interior
  },
  {
    filename: 'ai-after-hours.jpg',
    url: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80', // Building at night
  },
  {
    filename: 'ai-owner-reporting.jpg',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&q=80', // Analytics dashboard
  },
  {
    filename: 'ai-tenant-experience.jpg',
    url: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1920&q=80', // Living room interior
  },
  {
    filename: 'ai-smart-home.jpg',
    url: 'https://images.unsplash.com/photo-1558002038-1055907df827?w=1920&q=80', // Smart home device
  },
  {
    filename: 'ai-predictive.jpg',
    url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1920&q=80', // Data visualization
  },
  {
    filename: 'ai-innovation-leader.jpg',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1920&q=80', // Modern office
  },
  {
    filename: 'ai-future-pm.jpg',
    url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1920&q=80', // Technology / future
  },
]

async function uploadImage(img: { filename: string; url: string }): Promise<boolean> {
  console.log(`  ↓ ${img.filename}...`)

  const res = await fetch(img.url)
  if (!res.ok) {
    console.error(`  ✗ Download failed ${img.filename}: HTTP ${res.status}`)
    return false
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  const { error } = await supabase.storage.from(BUCKET).upload(img.filename, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })

  if (error) {
    console.error(`  ✗ Upload failed ${img.filename}: ${error.message}`)
    return false
  }

  console.log(`  ✓ ${img.filename} (${(buffer.length / 1024).toFixed(0)} KB)`)
  return true
}

async function main() {
  console.log(`📸 Uploading ${ALL_IMAGES.length} unique blog images to Supabase Storage...\n`)

  let ok = 0
  let fail = 0

  for (const img of ALL_IMAGES) {
    const result = await uploadImage(img)
    if (result) ok++
    else fail++
    await sleep(500) // gentle pacing
  }

  console.log(`\n✅ Done: ${ok} uploaded, ${fail} failed`)

  // Verify uniqueness by file size
  console.log('\n🔍 Checking for duplicates...')
  const { data: files } = await supabase.storage.from(BUCKET).list('', { limit: 200 })
  if (files) {
    const blogFiles = files.filter((f) =>
      ALL_IMAGES.some((img) => img.filename === f.name),
    )
    const sizeMap = new Map<number, string[]>()
    for (const f of blogFiles) {
      const size = f.metadata?.size || 0
      if (!sizeMap.has(size)) sizeMap.set(size, [])
      sizeMap.get(size)!.push(f.name)
    }
    let dupes = false
    for (const [size, names] of sizeMap) {
      if (names.length > 1 && size > 0) {
        console.log(`  ⚠ Same size (${(size / 1024).toFixed(0)} KB): ${names.join(', ')}`)
        dupes = true
      }
    }
    if (!dupes) console.log('  ✓ All images unique!')
  }
}

main().catch(console.error)
