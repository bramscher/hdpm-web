/**
 * Seed market areas from the hardcoded data in src/lib/market-areas.ts.
 *
 * Usage: npx tsx scripts/seed-market-areas.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

const AREAS = [
  {
    city: 'Bend',
    slug: 'bend',
    state: 'OR',
    tagline: "Oregon's outdoor playground",
    population: 105000,
    medianRent: 2100,
    heroImageUrl: 'https://images.unsplash.com/photo-1575397283492-fde3e31e31f8?w=1920&q=80',
    imageAlt: 'Deschutes River flowing through downtown Bend, Oregon',
    seoTitle: 'Property Management in Bend, Oregon',
    seoDescription: 'Professional property management in Bend, OR. High Desert Property Management handles tenant screening, maintenance, rent collection, and more for Bend rental properties.',
    description: [
      'Bend is the crown jewel of Central Oregon, drawing residents and visitors alike with world-class outdoor recreation, a thriving craft beer scene, and stunning Cascade mountain views. With over 300 days of sunshine per year, the city offers year-round access to skiing at Mt. Bachelor, mountain biking on hundreds of miles of trails, fly fishing on the Deschutes River, and kayaking on alpine lakes.',
      "The Bend rental market is one of the strongest in the Pacific Northwest. Consistent population growth, a booming tourism economy, and limited housing inventory keep demand high for quality rental properties. Whether you own a single-family home in the Old Mill District or a multi-unit complex on the east side, professional property management ensures you're maximizing returns while keeping your investment protected.",
      'High Desert Property Management has deep expertise in the Bend market. We understand neighborhood-level pricing differences, seasonal rental trends, and the expectations of Bend tenants. Our local presence means faster maintenance response times, more effective tenant screening, and higher occupancy rates for your property.',
    ],
    highlights: [
      'Strongest rental demand in Central Oregon with consistently low vacancy rates',
      'Year-round outdoor recreation drives a steady stream of relocating tenants',
      'Thriving local economy with tech, healthcare, and tourism sectors',
      'Premium rental rates supported by high quality of life and limited inventory',
    ],
  },
  {
    city: 'Redmond',
    slug: 'redmond',
    state: 'OR',
    tagline: 'The hub of Central Oregon',
    population: 38000,
    medianRent: 1700,
    heroImageUrl: 'https://images.unsplash.com/photo-1542425967-a2dd69fefbb9?w=600&q=80',
    imageAlt: 'Mountain views near Redmond, Oregon',
    seoTitle: 'Property Management in Redmond, Oregon',
    seoDescription: 'Trusted property management in Redmond, OR. High Desert Property Management provides full-service rental management for Redmond property owners.',
    description: [
      "Redmond is the transportation and commercial hub of Central Oregon, home to Roberts Field (the region's only commercial airport) and a rapidly growing population. The city has evolved from its agricultural roots into a diverse economic center with a growing tech sector, major retail corridors, and proximity to both Bend's amenities and the wide-open spaces of the high desert.",
      'The Redmond rental market offers property owners an attractive balance of affordability and demand. With median rents lower than neighboring Bend but strong tenant demand from airport employees, tech workers, and families seeking more space, Redmond delivers solid returns. New construction and infrastructure investment continue to drive growth and appreciation.',
      'Our team at High Desert Property Management knows the Redmond market inside and out. From established neighborhoods near downtown to newer developments on the city\'s expanding edges, we match properties with qualified tenants quickly and manage every detail from lease signing through move-out.',
    ],
    highlights: [
      "Home to Central Oregon's commercial airport (Roberts Field/RDM)",
      'More affordable than Bend with strong rental demand from a growing workforce',
      'Major tech sector growth with Facebook and Apple data center proximity',
      'Excellent schools and family-friendly neighborhoods attract long-term tenants',
    ],
  },
  {
    city: 'Sisters',
    slug: 'sisters',
    state: 'OR',
    tagline: 'Small-town mountain charm',
    population: 3500,
    medianRent: 1850,
    heroImageUrl: 'https://images.unsplash.com/photo-1687388217723-251d0ea8fc55?w=1920&q=80',
    imageAlt: 'Three Sisters mountains near Sisters, Oregon',
    seoTitle: 'Property Management in Sisters, Oregon',
    seoDescription: 'Professional property management in Sisters, OR. High Desert Property Management handles everything for Sisters rental owners.',
    description: [
      "Sisters is a picturesque mountain town nestled at the base of the Three Sisters peaks, known for its Western-themed downtown, vibrant arts community, and the legendary Sisters Folk Festival. With a population of around 3,500, it offers a tight-knit community atmosphere that's increasingly attractive to remote workers, retirees, and outdoor enthusiasts looking for a quieter pace of life.",
      "The rental market in Sisters is characterized by limited inventory and high demand, particularly for well-maintained homes that capture the town's mountain lodge aesthetic. Proximity to Hoodoo Ski Area, miles of hiking and mountain biking trails, and a charming downtown with galleries and restaurants make Sisters rentals highly desirable.",
      'High Desert Property Management provides Sisters property owners with responsive, hands-on management that matches the community\'s high standards. We understand what Sisters tenants expect and ensure your property reflects the quality and character that make this town special.',
    ],
    highlights: [
      'Extremely low vacancy rates due to limited rental inventory',
      'Desirable mountain-town lifestyle attracts high-quality tenants',
      'Near Hoodoo Ski Area and extensive trail systems for year-round recreation',
      'Strong arts and culture scene with the Sisters Folk Festival and gallery walks',
    ],
  },
  {
    city: 'Prineville',
    slug: 'prineville',
    state: 'OR',
    tagline: 'Where the desert meets the Ochocos',
    population: 12000,
    medianRent: 1400,
    heroImageUrl: 'https://images.unsplash.com/photo-1693719205045-dc0f15254790?w=1920&q=80',
    imageAlt: 'Smith Rock State Park near Prineville, Oregon',
    seoTitle: 'Property Management in Prineville, Oregon',
    seoDescription: 'Reliable property management in Prineville, OR. High Desert Property Management offers tenant placement, maintenance, and full-service rental management.',
    description: [
      "Prineville sits at the intersection of Central Oregon's high desert and the forested Ochoco Mountains, offering a unique landscape and a community rich in ranching heritage. As the county seat of Crook County and one of Oregon's oldest inland cities, Prineville has experienced a dramatic economic transformation thanks to major data center investments by Facebook (Meta) and Apple.",
      "The Prineville rental market benefits from this economic growth, with data center employment and supporting industries creating steady demand for housing. Rent levels remain significantly more affordable than Bend or Redmond, making Prineville an attractive option for investors seeking strong cash-on-cash returns.",
      'High Desert Property Management brings the same professional standards to Prineville that we deliver across all of Central Oregon. We handle tenant screening, maintenance coordination, and financial reporting so you can enjoy the returns from Prineville\'s growing rental market without the day-to-day hassle.',
    ],
    highlights: [
      'Growing economy driven by Meta and Apple data center campuses',
      'Most affordable rental market in Central Oregon with strong ROI potential',
      'Gateway to Smith Rock State Park and the Ochoco National Forest',
      'Historic downtown with a tight-knit community and improving infrastructure',
    ],
  },
  {
    city: 'Culver',
    slug: 'culver',
    state: 'OR',
    tagline: 'Quiet living above the canyon',
    population: 2000,
    medianRent: 1300,
    heroImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=80',
    imageAlt: 'Canyon and mountain views near Culver, Oregon',
    seoTitle: 'Property Management in Culver, Oregon',
    seoDescription: 'Property management in Culver, OR. High Desert Property Management provides full-service rental management for Culver property owners — tenant placement, maintenance, and more.',
    description: [
      "Culver is a small, tight-knit agricultural community perched on the rim of the Crooked River canyon in Jefferson County. With panoramic views of the Cascade peaks and a pace of life that moves with the seasons, Culver offers a rural Central Oregon experience that's increasingly hard to find. The town sits just minutes from Lake Billy Chinook, one of the region's premier destinations for boating, fishing, and camping.",
      "The Culver rental market is defined by its affordability and appeal to tenants who want space and quiet without being far from the conveniences of Redmond and Madras. Demand has grown as housing costs in neighboring cities push families and workers toward smaller communities with lower rents and a strong sense of community.",
      "High Desert Property Management brings professional management standards to Culver property owners. We handle tenant screening, maintenance coordination, and financial reporting so you can benefit from Culver's growing rental demand without the day-to-day responsibilities.",
    ],
    highlights: [
      'Affordable rents attract tenants seeking value close to Redmond and Madras',
      'Minutes from Lake Billy Chinook and the Cove Palisades State Park',
      'Rural character with Cascade mountain views and open farmland',
      'Growing demand as housing costs rise in neighboring communities',
    ],
  },
  {
    city: 'Metolius',
    slug: 'metolius',
    state: 'OR',
    tagline: 'Small-town roots, big views',
    population: 800,
    medianRent: 1250,
    heroImageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80',
    imageAlt: 'Mountain views and high desert landscape near Metolius, Oregon',
    seoTitle: 'Property Management in Metolius, Oregon',
    seoDescription: 'Property management in Metolius, OR. High Desert Property Management offers full-service rental management for Metolius property owners — tenant screening, maintenance, and rent collection.',
    description: [
      "Metolius is a quiet residential community in Jefferson County, nestled between Madras and Culver along the fertile plateau above the Deschutes River canyon. With views stretching from Mt. Jefferson to the Three Sisters, Metolius offers an affordable, family-friendly lifestyle surrounded by Central Oregon's signature high desert landscape.",
      "The rental market in Metolius benefits from its proximity to Madras employers and services while offering even lower housing costs. Tenants are drawn to the community's safe, walkable neighborhoods and small-town atmosphere. As rental demand grows across Jefferson County, Metolius properties provide strong returns relative to their acquisition costs.",
      "High Desert Property Management serves Metolius property owners with the same professional approach we bring across Central Oregon. From tenant placement to ongoing maintenance, we ensure your Metolius rental property is well-managed and performing at its best.",
    ],
    highlights: [
      'Among the most affordable rental markets in Central Oregon',
      'Close proximity to Madras employment and retail centers',
      'Quiet, family-oriented community with a strong sense of belonging',
      'Stunning Cascade mountain views and easy access to outdoor recreation',
    ],
  },
  {
    city: 'Madras',
    slug: 'madras',
    state: 'OR',
    tagline: 'Gateway to the high desert',
    population: 8000,
    medianRent: 1350,
    heroImageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1920&q=80',
    imageAlt: 'High desert landscape near Madras, Oregon',
    seoTitle: 'Property Management in Madras, Oregon',
    seoDescription: 'Professional property management in Madras, OR. High Desert Property Management delivers tenant screening, maintenance, rent collection, and more.',
    description: [
      "Madras is the warm-weather capital of Central Oregon, sitting on the sunny side of the Cascades in Jefferson County. Known for its agricultural heritage, stunning views of the Cascade peaks, and proximity to Lake Billy Chinook, one of Oregon's premier warm-water recreation destinations, Madras offers a lifestyle that blends small-town community with big outdoor adventure.",
      'The Madras rental market is driven by a diverse local economy that includes agriculture, manufacturing, and a growing tourism sector. With some of the most affordable rents in the region and a strong sense of community, Madras attracts tenants looking for value and a slower pace of life.',
      'High Desert Property Management serves Madras property owners with the same commitment to excellence we bring across Central Oregon. Our knowledge of the local market helps you price competitively, attract reliable tenants, and maintain your property to the highest standards.',
    ],
    highlights: [
      'Warmest and sunniest climate in Central Oregon with over 300 days of sun',
      'Lake Billy Chinook offers world-class fishing and water recreation',
      'Affordable cost of living draws steady tenant demand',
      'Diverse economy with agriculture, manufacturing, and growing tourism',
    ],
  },
]

async function seed() {
  console.log('🗺️  Seeding market areas...\n')

  const payload = await getPayload({ config })

  for (const area of AREAS) {
    const existing = await payload.find({
      collection: 'market-areas',
      where: { slug: { equals: area.slug } },
      limit: 1,
    })

    const data = {
      city: area.city,
      slug: area.slug,
      status: 'published' as const,
      state: area.state,
      tagline: area.tagline,
      population: area.population,
      medianRent: area.medianRent,
      heroImageUrl: area.heroImageUrl,
      imageAlt: area.imageAlt,
      seoTitle: area.seoTitle,
      seoDescription: area.seoDescription,
      description: area.description.map((p) => ({ paragraph: p })),
      highlights: area.highlights.map((t) => ({ text: t })),
    }

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'market-areas',
        id: existing.docs[0].id,
        data,
      })
      console.log(`  ✓ Updated: ${area.city}`)
    } else {
      await payload.create({
        collection: 'market-areas',
        data,
      })
      console.log(`  + Created: ${area.city}`)
    }
  }

  console.log('\n✅ Market areas seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
