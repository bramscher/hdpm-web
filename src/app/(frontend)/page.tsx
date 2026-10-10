import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo'
import { FOUNDED_YEAR } from '@/lib/constants'
import { getPageBySlug } from '@/lib/page-content'
import { getCachedListings } from '@/lib/appfolio'
import DesertHero from '@/components/v2/DesertHero'
import ProofStrip from '@/components/v2/ProofStrip'
import OwnerWorlds from '@/components/v2/OwnerWorlds'
import YearInMotion from '@/components/v2/YearInMotion'
import RoadTrip from '@/components/v2/RoadTrip'
import FeaturedListings from '@/components/sections/FeaturedListings'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import CTASection from '@/components/sections/CTASection'

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPageBySlug('home')
  return createMetadata({
    title:
      page?.meta?.title ||
      page?.title ||
      'Central Oregon Property Management',
    description:
      page?.meta?.description ||
      `High Desert Property Management provides full-service property management in Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras. Trusted by Central Oregon property owners since ${FOUNDED_YEAR}.`,
    path: '/',
  })
}

export default async function HomePage() {
  // Degrade to no featured listings (the section hides itself) rather than
  // 500ing the home page when AppFolio isn't configured, e.g. on Previews.
  const listings = await getCachedListings().catch(() => [])

  return (
    <>
      <DesertHero />
      <ProofStrip />
      <OwnerWorlds />
      <YearInMotion />
      <RoadTrip />
      <FeaturedListings listings={listings} />
      <TestimonialsSection />
      <CTASection />
    </>
  )
}
