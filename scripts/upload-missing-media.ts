/**
 * Upload missing AI blog images to Supabase Storage.
 *
 * Usage:
 *   npx tsx scripts/upload-missing-media.ts
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const BUCKET = 'media'

// Images from the AI blog seed script that need uploading
const IMAGES: { filename: string; sourceUrl: string }[] = [
  {
    filename: 'ai-maintenance-triage.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Old_Mill_District%2C_Bend%2C_OR_2009.jpg/1920px-Old_Mill_District%2C_Bend%2C_OR_2009.jpg',
  },
  {
    filename: 'ai-showings.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Drake_Park%2C_Mirror_Pond%2C_Bend_-_DPLA_-_7ba59f3f1851b41d6ff024508a4cccea.jpg/1920px-Drake_Park%2C_Mirror_Pond%2C_Bend_-_DPLA_-_7ba59f3f1851b41d6ff024508a4cccea.jpg',
  },
  {
    filename: 'ai-self-tours.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Smith_Rock_State_Park_29385739846.jpg/1920px-Smith_Rock_State_Park_29385739846.jpg',
  },
  {
    filename: 'ai-after-hours.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mt._Bachelor%2C_Oregon%2C_early_morning.jpg/1920px-Mt._Bachelor%2C_Oregon%2C_early_morning.jpg',
  },
  {
    filename: 'ai-owner-reporting.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg/1920px-View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg',
  },
  {
    filename: 'ai-tenant-experience.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG/1920px-Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG',
  },
  {
    filename: 'ai-smart-home.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Sparks_Lake%2C_South_Sister%2C_Oregon.jpg/1920px-Sparks_Lake%2C_South_Sister%2C_Oregon.jpg',
  },
  {
    filename: 'ai-predictive.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Deschutes_Wild_and_Scenic_River%2C_Oregon_%2836486230902%29.jpg/1920px-Deschutes_Wild_and_Scenic_River%2C_Oregon_%2836486230902%29.jpg',
  },
  {
    filename: 'ai-innovation-leader.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg/1920px-Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg',
  },
  {
    filename: 'ai-future-pm.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Central_Oregon_landscape.jpg/1920px-Central_Oregon_landscape.jpg',
  },
]

// Also check the original blog images
const ORIGINAL_IMAGES: { filename: string; sourceUrl: string }[] = [
  {
    filename: 'bend-neighborhood.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bend%2C_Oregon_%282014%29_-_02.JPG/1920px-Bend%2C_Oregon_%282014%29_-_02.JPG',
  },
  {
    filename: 'tenant-moving.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Old_Mill_District%2C_Bend%2C_OR_2009.jpg/1920px-Old_Mill_District%2C_Bend%2C_OR_2009.jpg',
  },
  {
    filename: 'winter-property.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mt._Bachelor%2C_Oregon%2C_early_morning.jpg/1920px-Mt._Bachelor%2C_Oregon%2C_early_morning.jpg',
  },
  {
    filename: 'oregon-law.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Deschutes_River_%28Deschutes_County%2C_Oregon_scenic_images%29_%28desDA0093a%29.jpg',
  },
  {
    filename: 'smith-rock.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Smith_Rock_State_Park_29385739846.jpg/1920px-Smith_Rock_State_Park_29385739846.jpg',
  },
  {
    filename: 'high-desert.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Central_Oregon_landscape.jpg/1920px-Central_Oregon_landscape.jpg',
  },
  {
    filename: 'sisters-town.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG/1920px-Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG',
  },
  {
    filename: 'fire-season.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Ponderosa_pine_bark_and_lichens_%28Crooked_River_National_Grassland%2C_Oregon%29.jpg/1920px-Ponderosa_pine_bark_and_lichens_%28Crooked_River_National_Grassland%2C_Oregon%29.jpg',
  },
  {
    filename: 'cascade-lakes.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg/1920px-View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg',
  },
  {
    filename: 'three-sisters.jpg',
    sourceUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg/1920px-Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg',
  },
]

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function fetchWithRetry(url: string, retries = 5, delay = 5000): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    if (i > 0) {
      console.log(`    Retry ${i}/${retries} after ${delay / 1000}s...`)
      await sleep(delay)
      delay *= 2
    }
    const res = await fetch(url, {
      headers: { 'User-Agent': 'HDPM-Web/1.0 (media upload script)' },
    })
    if (res.ok) return res
    if (res.status !== 429) throw new Error(`HTTP ${res.status}`)
  }
  throw new Error('Max retries exceeded (429)')
}

async function uploadImage(img: { filename: string; sourceUrl: string }): Promise<boolean> {
  // Check if already exists
  const { data: existing } = await supabase.storage.from(BUCKET).list('', {
    search: img.filename,
  })

  if (existing && existing.some(f => f.name === img.filename)) {
    console.log(`  ✓ ${img.filename} (already exists)`)
    return true
  }

  // Download from source with retry
  console.log(`  ↓ Downloading ${img.filename}...`)
  let res: Response
  try {
    res = await fetchWithRetry(img.sourceUrl)
  } catch (err) {
    console.error(`  ✗ Failed to download ${img.filename}: ${err}`)
    return false
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  console.log(`  ↑ Uploading ${img.filename} (${(buffer.length / 1024).toFixed(0)} KB)...`)

  const { error } = await supabase.storage.from(BUCKET).upload(img.filename, buffer, {
    contentType: 'image/jpeg',
    upsert: true,
  })

  if (error) {
    console.error(`  ✗ Failed to upload ${img.filename}:`, error.message)
    return false
  }

  console.log(`  ✓ ${img.filename} uploaded`)
  return true
}

async function main() {
  console.log('🔍 Checking Supabase Storage bucket...')

  // Ensure bucket exists
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET)

  if (!bucketExists) {
    console.log(`  Creating bucket "${BUCKET}"...`)
    const { error } = await supabase.storage.createBucket(BUCKET, { public: true })
    if (error) {
      console.error('  Failed to create bucket:', error.message)
      return
    }
  }

  const allImages = [...IMAGES, ...ORIGINAL_IMAGES]
  console.log(`\n📸 Processing ${allImages.length} images...\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const img of allImages) {
    const result = await uploadImage(img)
    if (result) {
      uploaded++
    } else {
      failed++
    }
    // Rate limit: wait 5s between downloads to avoid Wikimedia 429s
    await sleep(5000)
  }

  console.log(`\n✅ Done: ${uploaded} succeeded, ${failed} failed`)

  // Also check for central-oregon-living.jpg referenced on the live site
  const extraFiles = ['central-oregon-living.jpg']
  for (const filename of extraFiles) {
    const { data: existing } = await supabase.storage.from(BUCKET).list('', { search: filename })
    if (!existing || !existing.some(f => f.name === filename)) {
      console.log(`\n⚠️  "${filename}" referenced on site but not in storage — may need manual upload`)
    }
  }
}

main().catch(console.error)
