/**
 * Seed the `pages` collection with all website pages.
 *
 * Usage: npx tsx scripts/seed-pages.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

type PageLayout =
  | 'home'
  | 'about'
  | 'owners'
  | 'tenants'
  | 'contact'
  | 'listings'
  | 'services'
  | 'residents'
  | 'privacy'
  | 'default'

const PAGES: Array<{ title: string; slug: string; layout: PageLayout; [key: string]: unknown }> = [
  {
    title: 'Home',
    slug: 'home',
    layout: 'home',
    homeContent: {
      heroBadge: 'Serving Central Oregon Since 1999',
      heroHeading: 'Central Oregon Property Management You Can Trust',
      heroSubheading:
        'Maximize your rental income and protect your investment with full-service property management in Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras.',
      heroCTA1Label: 'Get a Free Rental Analysis',
      heroCTA1Link: '/owners',
      heroCTA2Label: 'Browse Rentals',
      heroCTA2Link: '/listings',
    },
  },
  {
    title: 'About Us',
    slug: 'about',
    layout: 'about',
    aboutContent: {
      heroHeading: 'About High Desert Property Management',
      heroSubheading: 'Trusted by Central Oregon property owners for over a decade.',
      storyLabel: 'Our Story',
      storyHeading: 'Serving Central Oregon Since 1999',
      storyParagraphs: [
        {
          text: 'High Desert Property Management operates with a simple mission: to provide Central Oregon property owners with professional, reliable management they can trust. Over the years, we\'ve grown into one of the region\'s most respected property management companies.',
        },
        {
          text: 'Over the years, we\'ve built our reputation on honest communication, meticulous attention to detail, and a genuine commitment to protecting our clients\' investments. Today, we manage hundreds of properties across Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras — from single-family homes to multi-unit complexes.',
        },
        {
          text: 'Our team lives and works in Central Oregon. We understand the unique dynamics of this market — from seasonal rental trends to the nuances of each community. That local knowledge, combined with proven systems and technology, allows us to deliver results that out-of-area management companies simply can\'t match.',
        },
      ],
      values: [
        {
          title: 'Integrity',
          description:
            'We believe in transparent communication, honest reporting, and doing the right thing — even when no one is watching. Your trust is the foundation of everything we do.',
        },
        {
          title: 'Local Expertise',
          description:
            'We live and work in Central Oregon. Our deep knowledge of local rental markets, seasonal trends, and community nuances gives your property a competitive edge.',
        },
        {
          title: 'Owner-First Approach',
          description:
            'Your investment goals drive every decision we make. From maximizing rental income to minimizing vacancy, we treat your property as if it were our own.',
        },
      ],
    },
  },
  {
    title: 'Property Owners',
    slug: 'owners',
    layout: 'owners',
    ownersContent: {
      heroHeading: 'Property Management for Central Oregon Owners',
      heroSubheading:
        "Maximize your rental income and protect your investment with Central Oregon's most trusted property management team. We deliver peace of mind so you can enjoy the lifestyle you moved here for.",
      heroCTA1Label: 'Get a Free Rental Analysis',
      heroCTA1Link: '#get-started',
      whyItems: [
        {
          title: 'Local Expertise',
          description:
            'We live and work in Central Oregon. Our deep knowledge of the Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras markets means accurate pricing and faster placements.',
        },
        {
          title: 'Transparent Pricing',
          description:
            'No hidden fees, no surprise charges. Our competitive management fees are clearly outlined so you know exactly what to expect from day one.',
        },
        {
          title: 'Technology-Driven',
          description:
            'Real-time owner portals, online rent collection, digital lease signing, and automated reporting. Modern tools that keep you informed and your tenants happy.',
        },
      ],
      services: [
        {
          title: 'Full-Service Property Management',
          description:
            'Let us handle every aspect of your rental property so you can enjoy true passive income.',
          imageUrl:
            'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
          imageAlt: 'Modern residential home',
          features: [
            { text: 'Comprehensive tenant screening' },
            { text: 'Lease preparation and enforcement' },
            { text: 'Monthly rent collection' },
            { text: 'Regular property inspections' },
            { text: 'Lease renewal negotiations' },
          ],
        },
        {
          title: 'Tenant Placement',
          description:
            'Finding the right tenant is the single most important factor in protecting your investment.',
          imageUrl:
            'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80',
          imageAlt: 'Keys being handed over',
          features: [
            { text: 'Professional photography' },
            { text: 'Syndication across 30+ platforms' },
            { text: 'Coordinated showings' },
            { text: 'Thorough background checks' },
            { text: 'Move-in coordination' },
          ],
        },
        {
          title: 'Maintenance Coordination',
          description:
            'Protect your property value with responsive, cost-effective maintenance.',
          imageUrl:
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&q=80',
          imageAlt: 'Maintenance technician',
          features: [
            { text: '24/7 emergency hotline' },
            { text: 'Trusted local contractors' },
            { text: 'Preventive maintenance' },
            { text: 'Owner approval thresholds' },
            { text: 'Detailed documentation' },
          ],
        },
        {
          title: 'Financial Reporting',
          description: 'Full visibility into your investment performance.',
          imageUrl:
            'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80',
          imageAlt: 'Financial reporting dashboard',
          features: [
            { text: 'Monthly owner statements' },
            { text: 'Year-end tax packages' },
            { text: 'Real-time owner portal' },
            { text: 'Multi-property reporting' },
            { text: 'Direct deposit proceeds' },
          ],
        },
      ],
      pricingItems: [
        { label: 'Full-Service Management', note: 'Percentage of monthly rent collected' },
        { label: 'Tenant Placement', note: 'One-time fee per placement' },
        { label: 'Lease Renewal', note: 'Flat fee per renewal' },
        { label: 'Maintenance Coordination', note: 'Included with full-service' },
      ],
      ctaHeading: 'Get Your Free Rental Analysis',
      ctaBody:
        'Find out how much your Central Oregon property could earn with professional management. Our free, no-obligation analysis includes a market rent estimate, property assessment, and customized management plan.',
    },
  },
  {
    title: 'Tenants',
    slug: 'tenants',
    layout: 'tenants',
    tenantsContent: {
      heroHeading: 'Your Next Home in Central Oregon',
      heroSubheading:
        "Whether you're a current tenant or searching for your next rental, we're here to make your experience seamless.",
      portalCards: [
        {
          title: 'Pay Rent Online',
          description:
            'Make secure rent payments anytime through our online tenant portal.',
          href: 'https://highdesertpm.appfolio.com/connect/users/sign_in',
        },
        {
          title: 'Submit Maintenance Request',
          description:
            'Report maintenance issues quickly through our online portal.',
          href: 'https://highdesertpm.appfolio.com/connect/users/sign_in',
        },
        {
          title: 'Tenant Resources',
          description:
            'Access lease information, move-in and move-out guides, and community guidelines.',
          href: 'https://highdesertpm.appfolio.com/connect/users/sign_in',
        },
      ],
      applicationSteps: [
        {
          title: 'Browse Listings',
          description: 'Explore our available rental properties across Central Oregon.',
        },
        {
          title: 'Submit Application',
          description: 'Complete our online rental application with your info.',
        },
        {
          title: 'Background Check',
          description:
            'We run thorough screening including credit, criminal, and rental history.',
        },
        {
          title: 'Move In',
          description:
            'Once approved, sign your lease, pay your deposit, and pick up your keys.',
        },
      ],
      faqs: [
        {
          question: 'How much is the security deposit?',
          answer:
            "Security deposits are typically equal to one month's rent, though this may vary depending on the property. The exact deposit amount is stated in your lease agreement. Deposits are held in a trust account and returned within 31 days of move-out, per Oregon law.",
        },
        {
          question: 'What is your pet policy?',
          answer:
            'Pet policies vary by property. Many of our rentals do allow pets with an additional pet deposit and/or monthly pet rent. Breed and weight restrictions may apply. Service and emotional support animals are accommodated in accordance with Fair Housing laws.',
        },
        {
          question: 'How long are lease terms?',
          answer:
            'Most of our leases are 12-month terms. Some properties may offer shorter or longer lease options. At the end of your initial lease term, you may be offered a renewal or convert to month-to-month.',
        },
        {
          question: 'How do I submit a maintenance request?',
          answer:
            'Log into the tenant portal at any time to submit a maintenance request. For true emergencies (flooding, fire, gas leak, no heat in winter), call our 24/7 emergency line immediately.',
        },
        {
          question: 'When is rent due and how do I pay?',
          answer:
            'Rent is due on the 1st of each month. You can pay online through the tenant portal via ACH bank transfer or credit/debit card. We strongly recommend setting up auto-pay.',
        },
        {
          question: 'What do I need to apply?',
          answer:
            'You will need a valid photo ID, proof of income, and rental history for the past 3 years. Each adult applicant must submit a separate application and pay a non-refundable application fee.',
        },
        {
          question: 'Can I make changes to the property?',
          answer:
            'Any modifications — including painting, installing fixtures, or landscaping changes — require prior written approval from management.',
        },
        {
          question: 'What happens if I need to break my lease early?',
          answer:
            'Early lease termination is handled case-by-case. Generally, you are responsible for rent through the end of the lease term or until a new tenant is placed. An early termination fee may apply.',
        },
      ],
      ctaHeading: 'Ready to Find Your Home?',
      ctaBody:
        'Browse our available rental listings or contact us to learn more about living in Central Oregon.',
    },
  },
  {
    title: 'Contact Us',
    slug: 'contact',
    layout: 'contact',
    contactContent: {
      heroHeading: 'Get in Touch',
      heroSubheading:
        "Have questions about our property management services? We'd love to hear from you.",
      officeAddress: '1515 SW Reindeer Ave, Redmond, OR 97756',
      officePhone: '(541) 548-0383',
      officeEmail: 'info@highdesertpm.com',
      officeHours: 'Monday – Friday, 9:00 AM – 4:00 PM',
    },
  },
  {
    title: 'Available Rentals',
    slug: 'listings',
    layout: 'listings',
    listingsContent: {
      heroHeading: 'Available Rentals',
      heroSubheading: 'Find your next home in Central Oregon',
    },
  },
  {
    title: 'Our Services',
    slug: 'services',
    layout: 'services',
    richContent: {
      heroHeading: 'Our Services',
      heroSubheading: 'Comprehensive property management for Central Oregon.',
    },
  },
  {
    title: 'Residents',
    slug: 'residents',
    layout: 'residents',
    richContent: {
      heroHeading: 'Resident Resources',
      heroSubheading: 'Everything you need as a current resident.',
    },
  },
  {
    title: 'Privacy Policy',
    slug: 'privacy',
    layout: 'privacy',
    richContent: {
      heroHeading: 'Privacy Policy',
      heroSubheading: 'How we handle your information.',
    },
  },
]

async function seed() {
  console.log('📄 Seeding pages...\n')

  const payload = await getPayload({ config })

  for (const page of PAGES) {
    const existing = await payload.find({
      collection: 'pages',
      where: { slug: { equals: page.slug } },
      limit: 1,
    })

    const data = {
      ...page,
      status: 'published' as const,
    }

    if (existing.docs.length > 0) {
      await payload.update({
        collection: 'pages',
        id: existing.docs[0].id,
        data,
      })
      console.log(`  ✓ Updated: ${page.title} (/${page.slug})`)
    } else {
      await payload.create({
        collection: 'pages',
        data,
      })
      console.log(`  + Created: ${page.title} (/${page.slug})`)
    }
  }

  console.log('\n✅ Pages seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
