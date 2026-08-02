/**
 * Attach curated inline photos to market-area content sections (matched by
 * section heading). All images are authentic Central Oregon photos from
 * Wikimedia Commons, verified for license and content on 2026-08-01.
 * Each URL is HEAD-checked before being written.
 *
 * Usage: npx tsx scripts/seed-market-images.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const W = 'https://upload.wikimedia.org/wikipedia/commons'

interface SectionImage {
  heading: string
  url: string
  alt: string
  caption: string
  credit: string
}

const IMAGES: Record<string, SectionImage[]> = {
  bend: [
    {
      heading: 'Let Us Manage Your Bend Rental Property',
      url: `${W}/thumb/7/70/Drake_Park_house_-_Bend_Oregon.jpg/1920px-Drake_Park_house_-_Bend_Oregon.jpg`,
      alt: 'Craftsman home in the Drake Park Neighborhood Historic District, Bend, Oregon',
      caption: 'A home in Bend’s Drake Park Neighborhood Historic District.',
      credit: 'Photo: Orygun, CC BY-SA 3.0, via Wikimedia Commons',
    },
    {
      heading: 'Bend Neighborhoods We Know',
      url: `${W}/thumb/0/06/Bend_Old_Mill_District_%2852369765343%29.jpg/1920px-Bend_Old_Mill_District_%2852369765343%29.jpg`,
      alt: 'The three smokestacks of the Old Mill District along the Deschutes River in Bend',
      caption: 'The Old Mill District’s landmark smokestacks on the Deschutes River.',
      credit: 'Photo: Oregon Department of Transportation, CC BY 2.0, via Wikimedia Commons',
    },
    {
      heading: 'About Bend, Oregon',
      url: `${W}/thumb/f/f0/Downtown_Bend_-_view_of_Pilot_Butte.jpg/1920px-Downtown_Bend_-_view_of_Pilot_Butte.jpg`,
      alt: 'Downtown Bend street view with Pilot Butte rising in the background',
      caption: 'Downtown Bend, with Pilot Butte on the horizon.',
      credit: 'Photo: CC0, via Wikimedia Commons',
    },
  ],
  redmond: [
    {
      heading: 'Property Management From Redmond, For Redmond',
      url: `${W}/thumb/1/13/Redmond%2C_Oregon%2C_Business_Hwy_97.jpg/1920px-Redmond%2C_Oregon%2C_Business_Hwy_97.jpg`,
      alt: 'Business Highway 97 through Redmond, Oregon',
      caption: 'Business Highway 97 through the heart of Redmond.',
      credit: 'Photo: Doug Kerr, CC BY-SA 2.0, via Wikimedia Commons',
    },
    {
      heading: 'Redmond Areas We Manage',
      url: `${W}/thumb/6/66/Pilot_Butte_Canal_1_-_Redmond_Oregon.jpg/1920px-Pilot_Butte_Canal_1_-_Redmond_Oregon.jpg`,
      alt: 'The Pilot Butte Canal flowing northeast of downtown Redmond, Oregon',
      caption: 'The historic Pilot Butte Canal, northeast of downtown Redmond.',
      credit: 'Photo: Ian Poellet, CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      heading: 'About Redmond, Oregon',
      url: `${W}/thumb/0/01/Smith_Rock_State_Park_Oregon_D3C1205-400516A033.jpg/1920px-Smith_Rock_State_Park_Oregon_D3C1205-400516A033.jpg`,
      alt: 'The cliffs of Smith Rock State Park above the Crooked River near Redmond, Oregon',
      caption: 'Smith Rock State Park — fifteen minutes from Redmond.',
      credit: 'Photo: public domain, via Wikimedia Commons',
    },
  ],
  sisters: [
    {
      heading: 'Managing Rentals in Sisters',
      url: `${W}/thumb/2/29/Sisters_-_DPLA_-_149b2868a29c08cd807391a004018685.jpg/1920px-Sisters_-_DPLA_-_149b2868a29c08cd807391a004018685.jpg`,
      alt: 'Western-themed storefronts in downtown Sisters, Oregon',
      caption: 'Downtown Sisters’ signature western storefronts.',
      credit: 'Photo: Gary Halvorson, Oregon State Archives, CC BY 4.0, via Wikimedia Commons',
    },
    {
      heading: 'Maintenance in the Pines',
      url: `${W}/thumb/b/bc/Metolius_River_near_Wizard_Falls.jpg/1920px-Metolius_River_near_Wizard_Falls.jpg`,
      alt: 'The Metolius River flowing through ponderosa pines near Wizard Falls',
      caption: 'The Metolius River near Wizard Falls, in the pine country northwest of Sisters.',
      credit: 'Photo: public domain, via Wikimedia Commons',
    },
    {
      heading: 'About Sisters, Oregon',
      url: `${W}/thumb/e/eb/Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg/1920px-Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg`,
      alt: 'The Three Sisters peaks reflected in Mirror Lake',
      caption: 'The Three Sisters, the town’s namesake peaks.',
      credit: 'Photo: public domain, via Wikimedia Commons',
    },
  ],
  prineville: [
    {
      heading: 'Managing Rentals in Prineville',
      url: `${W}/4/4e/Prineville%2C_Oregon%2C_from_overlook.jpg`,
      alt: 'Prineville, Oregon and the Crooked River valley seen from the Ochoco Highway overlook',
      caption: 'Prineville and the Crooked River valley from the rim overlook.',
      credit: 'Photo: Mïk Watson, CC BY-SA 2.0, via Wikimedia Commons',
    },
    {
      heading: 'About Prineville, Oregon',
      url: `${W}/thumb/5/5e/Ochoco_Reservoir.......JPG/1920px-Ochoco_Reservoir.......JPG`,
      alt: 'Ochoco Reservoir east of Prineville, Oregon',
      caption: 'Ochoco Reservoir, minutes east of town.',
      credit: 'Photo: PGHolbrook, CC BY-SA 3.0, via Wikimedia Commons',
    },
  ],
  culver: [
    {
      heading: 'Rental Management in Culver',
      url: `${W}/thumb/e/e9/Lake_Billy_Chinook%2C_Oregon_%2835860948095%29.jpg/1920px-Lake_Billy_Chinook%2C_Oregon_%2835860948095%29.jpg`,
      alt: 'The canyon waters of Lake Billy Chinook near Culver, Oregon',
      caption: 'Lake Billy Chinook and the Cove Palisades, minutes from Culver.',
      credit: 'Photo: CC0, via Wikimedia Commons',
    },
    {
      heading: 'Who Rents in Culver',
      url: `${W}/thumb/a/ac/342_lake_billy_chinook_odfw_%2815659687221%29.jpg/1920px-342_lake_billy_chinook_odfw_%2815659687221%29.jpg`,
      alt: 'Cliffs rising above Lake Billy Chinook in Central Oregon',
      caption: 'The basalt rims above Lake Billy Chinook.',
      credit: 'Photo: Oregon Department of Fish & Wildlife, CC BY-SA 2.0, via Wikimedia Commons',
    },
  ],
  metolius: [
    {
      heading: 'Rental Management in Metolius',
      url: `${W}/thumb/9/9e/Mount_Jefferson_Oregon.jpg/1920px-Mount_Jefferson_Oregon.jpg`,
      alt: 'Snow-capped Mount Jefferson, the peak overlooking the Metolius area',
      caption: 'Mount Jefferson, the backdrop to Jefferson County.',
      credit: 'Photo: public domain, via Wikimedia Commons',
    },
    {
      heading: 'Owning Rental Property in Metolius',
      url: `${W}/thumb/1/19/Metolius_River_hike_-_2024.jpg/1920px-Metolius_River_hike_-_2024.jpg`,
      alt: 'The spring-fed Metolius River flowing through the forest',
      caption: 'The Metolius River, the town’s spring-fed namesake.',
      credit: 'Photo: Loren Kerns, CC BY 2.0, via Wikimedia Commons',
    },
  ],
  madras: [
    {
      heading: 'Rental Management in Madras',
      url: `${W}/thumb/d/dc/Mount_Jefferson_%28Oregon%29_from_the_southwest.jpg/1920px-Mount_Jefferson_%28Oregon%29_from_the_southwest.jpg`,
      alt: 'Mount Jefferson, part of the Cascade panorama visible from Madras',
      caption: 'Mount Jefferson — Madras sits front-row to the full Cascade lineup.',
      credit: 'Photo: Jsayre64, CC BY-SA 4.0, via Wikimedia Commons',
    },
    {
      heading: 'The Madras Market',
      url: `${W}/thumb/3/3a/Lueddemann_House_-_Madras_Oregon.jpg/1920px-Lueddemann_House_-_Madras_Oregon.jpg`,
      alt: 'The historic 1905 Lueddemann House in Madras, Oregon',
      caption: 'The 1905 Lueddemann House — Madras’ housing stock spans a century.',
      credit: 'Photo: Ian Poellet, CC BY-SA 3.0, via Wikimedia Commons',
    },
  ],
}

async function verifyUrl(url: string): Promise<boolean> {
  try {
    // Wikimedia rejects UA-less requests
    const res = await fetch(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'hdpm-web/1.0 (contact: info@highdesertpm.com)' },
    })
    return res.ok
  } catch {
    return false
  }
}

async function seed() {
  console.log('🖼  Seeding market-area section images...\n')
  const payload = await getPayload({ config })

  for (const [slug, images] of Object.entries(IMAGES)) {
    const { docs } = await payload.find({
      collection: 'market-areas',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = docs[0]
    if (!doc?.contentSections?.length) {
      console.log(`  ⚠️  ${slug}: no contentSections — skipped`)
      continue
    }

    // Verify URLs first; only verified images get attached
    const verified = new Map<string, SectionImage>()
    for (const img of images) {
      if (!doc.contentSections.some((s: { heading: string }) => s.heading === img.heading)) {
        console.log(`  ⚠️  ${slug}: no section titled "${img.heading}"`)
        continue
      }
      if (!(await verifyUrl(img.url))) {
        console.log(`  ❌ ${slug}: URL failed HEAD check, NOT attached — ${img.url}`)
        continue
      }
      verified.set(img.heading, img)
    }

    let attached = 0
    const sections = doc.contentSections.map(
      (section: { heading: string; image?: unknown }) => {
        const match = verified.get(section.heading)
        if (!match) return section
        attached++
        return {
          ...section,
          image: {
            url: match.url,
            alt: match.alt,
            caption: match.caption,
            credit: match.credit,
          },
        }
      },
    )

    await payload.update({
      collection: 'market-areas',
      id: doc.id,
      data: { contentSections: sections } as never,
    })
    console.log(`  ✏️  ${slug}: ${attached}/${images.length} images attached`)
  }

  console.log('\n✅ Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
