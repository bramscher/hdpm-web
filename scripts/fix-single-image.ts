/**
 * Replace bad blog images with verified Central Oregon Unsplash photos.
 * Every URL below has been visually verified before inclusion.
 *
 * Usage: npx tsx scripts/fix-single-image.ts
 */
import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

// All URLs verified visually — confirmed Central Oregon or PNW appropriate
const REPLACEMENTS: { filename: string; url: string }[] = [
  // Deschutes River flowing through Bend — perfect for neighborhood guide
  { filename: 'bend-neighborhood.jpg', url: 'https://images.unsplash.com/photo-1575397283492-fde3e31e31f8?w=1920&q=80' },
  // Mt. Bachelor through ponderosa pines — classic Central Oregon
  { filename: 'tenant-moving.jpg', url: 'https://images.unsplash.com/photo-1542425967-a2dd69fefbb9?w=1920&q=80' },
  // Three Sisters from high desert grassland at sunset
  { filename: 'central-oregon-living.jpg', url: 'https://images.unsplash.com/photo-1687388217723-251d0ea8fc55?w=1920&q=80' },
  // Kayaking on clear green alpine lake with pines
  { filename: 'things-to-do.jpg', url: 'https://images.unsplash.com/photo-1769197047973-265783a7f1f4?w=1920&q=80' },
  // Smith Rock State Park — the real thing
  { filename: 'smith-rock.jpg', url: 'https://images.unsplash.com/photo-1693719205045-dc0f15254790?w=1920&q=80' },
  // Three Sisters mountain range at sunset — iconic Sisters area view
  { filename: 'sisters-town.jpg', url: 'https://images.unsplash.com/photo-1718927445954-b050d18bc135?w=1920&q=80' },
  // Mt. Bachelor reflected in alpine lake — Cascade Lakes
  { filename: 'cascade-lakes.jpg', url: 'https://images.unsplash.com/photo-1687451223552-c7afa980bdad?w=1920&q=80' },
  // Broken Top through ponderosa pines — Three Sisters area
  { filename: 'three-sisters.jpg', url: 'https://images.unsplash.com/photo-1646528487362-962045c5eeb9?w=1920&q=80' },
  // Aerial view of river through Central Oregon green landscape
  { filename: 'ai-maintenance-triage.jpg', url: 'https://images.unsplash.com/photo-1565846894054-51426d448b96?w=1920&q=80' },
  // Misty morning on a Central Oregon lake
  { filename: 'ai-after-hours.jpg', url: 'https://images.unsplash.com/photo-1676999163461-7d90a767c4fc?w=1920&q=80' },
  // Autumn forest canopy aerial — PNW pine forest
  { filename: 'ai-predictive.jpg', url: 'https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=1920&q=80' },
  // Mountain sunset silhouette — inspiring landscape
  { filename: 'ai-innovation-leader.jpg', url: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1920&q=80' },
  // Road leading to Mt. Bachelor through pines — forward-looking
  { filename: 'ai-future-pm.jpg', url: 'https://images.unsplash.com/photo-1687451225150-e25d21b013cc?w=1920&q=80' },
]

async function main() {
  console.log(`📸 Replacing ${REPLACEMENTS.length} blog images with verified Central Oregon photos...\n`)

  let ok = 0
  let fail = 0

  for (const img of REPLACEMENTS) {
    process.stdout.write(`  ${img.filename}... `)
    const res = await fetch(img.url)
    if (!res.ok) {
      console.log(`✗ HTTP ${res.status}`)
      fail++
      continue
    }
    const buffer = Buffer.from(await res.arrayBuffer())
    const { error } = await supabase.storage.from('media').upload(img.filename, buffer, {
      contentType: 'image/jpeg',
      upsert: true,
    })
    if (error) {
      console.log(`✗ ${error.message}`)
      fail++
    } else {
      console.log(`✓ (${(buffer.length / 1024).toFixed(0)} KB)`)
      ok++
    }
    await sleep(300)
  }

  console.log(`\n✅ Done: ${ok} replaced, ${fail} failed`)
}

main().catch(console.error)
