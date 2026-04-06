import type { Metadata } from 'next'
import { createMetadata } from '@/lib/seo'
import { getPageBySlug } from '@/lib/page-content'
import { getCachedListings } from '@/lib/appfolio'
import Hero from '@/components/sections/Hero'
import ServicesOverview from '@/components/sections/ServicesOverview'
import FeaturedListings from '@/components/sections/FeaturedListings'
import MarketAreasSection from '@/components/sections/MarketAreasSection'
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
      'High Desert Property Management provides full-service property management in Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras. Trusted by Central Oregon property owners since 2011.',
    path: '/',
  })
}

export default async function HomePage() {
  const [page, listings] = await Promise.all([
    getPageBySlug('home'),
    getCachedListings(),
  ])
  const heroContent = page?.homeContent

  return (
    <>
      <Hero content={heroContent} />
      <ServicesOverview />
      <FeaturedListings listings={listings} />
      <MarketAreasSection />
      <TestimonialsSection />
      <CTASection />
    </>
  )
}
