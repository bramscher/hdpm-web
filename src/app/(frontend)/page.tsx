import { createMetadata } from '@/lib/seo'
import { getCachedListings } from '@/lib/appfolio'
import Hero from '@/components/sections/Hero'
import ServicesOverview from '@/components/sections/ServicesOverview'
import FeaturedListings from '@/components/sections/FeaturedListings'
import MarketAreasSection from '@/components/sections/MarketAreasSection'
import TestimonialsSection from '@/components/sections/TestimonialsSection'
import CTASection from '@/components/sections/CTASection'

export const metadata = createMetadata({
  title: 'Central Oregon Property Management',
  description:
    'High Desert Property Management provides full-service property management in Bend, Redmond, Sisters, Prineville, La Pine, and Madras. Trusted by Central Oregon property owners since 2011.',
  path: '/',
})

export default async function HomePage() {
  const listings = await getCachedListings()

  return (
    <main>
      <Hero />
      <ServicesOverview />
      <FeaturedListings listings={listings} />
      <MarketAreasSection />
      <TestimonialsSection />
      <CTASection />
    </main>
  )
}
