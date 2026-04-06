import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { marketAreaSlugs } from '@/lib/market-areas'
import { getCachedListings } from '@/lib/appfolio'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://highdesertpm.com'

const staticRoutes: Array<{
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
  priority: number
}> = [
  { path: '/', changeFrequency: 'weekly', priority: 1.0 },
  { path: '/owners', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/tenants', changeFrequency: 'monthly', priority: 0.9 },
  { path: '/listings', changeFrequency: 'daily', priority: 0.9 },
  { path: '/market-areas', changeFrequency: 'monthly', priority: 0.8 },
  { path: '/about', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/services', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/residents', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/blog', changeFrequency: 'weekly', priority: 0.7 },
  { path: '/contact', changeFrequency: 'yearly', priority: 0.6 },
  { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified: now,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))

  const marketAreaEntries: MetadataRoute.Sitemap = marketAreaSlugs.map(
    (slug) => ({
      url: `${SITE_URL}/market-areas/${slug}`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }),
  )

  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'posts',
      where: { status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    })
    blogEntries = docs.map((post) => ({
      url: `${SITE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    // Payload unavailable at build time — skip blog entries
  }

  let listingEntries: MetadataRoute.Sitemap = []
  try {
    const listings = await getCachedListings()
    listingEntries = listings.map((listing) => ({
      url: `${SITE_URL}/listings/${listing.Id}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.7,
    }))
  } catch {
    // AppFolio unavailable — skip listing entries
  }

  return [
    ...staticEntries,
    ...marketAreaEntries,
    ...blogEntries,
    ...listingEntries,
  ]
}
