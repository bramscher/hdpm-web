import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getCachedListings } from '@/lib/appfolio'
import { SITE_URL } from '@/lib/site-url'

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

  let marketAreaEntries: MetadataRoute.Sitemap = []
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'market-areas',
      where: { status: { equals: 'published' } },
      limit: 100,
      depth: 0,
    })
    marketAreaEntries = docs.map((area) => ({
      url: `${SITE_URL}/market-areas/${area.slug}`,
      lastModified: area.updatedAt ? new Date(area.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.8,
    }))
  } catch {
    // Payload unavailable at build time — skip market area entries
  }

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

  let pageEntries: MetadataRoute.Sitemap = []
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'pages',
      where: { status: { equals: 'published' } },
      limit: 1000,
      depth: 0,
    })
    pageEntries = docs.map((page) => ({
      url: `${SITE_URL}/${page.slug}`,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : now,
      changeFrequency: 'monthly',
      priority: 0.6,
    }))
  } catch {
    // Payload unavailable at build time — skip CMS pages
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
    ...pageEntries,
    ...listingEntries,
  ]
}
