import { getPayload } from 'payload'
import config from '@payload-config'
import type { Page } from '@/payload-types'

/**
 * Fetch a published CMS page by slug.
 * Returns null if the page doesn't exist or isn't published.
 */
export async function getPageBySlug(slug: string): Promise<Page | null> {
  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'pages',
      where: {
        slug: { equals: slug },
        status: { equals: 'published' },
      },
      limit: 1,
      depth: 2,
    })
    return docs[0] ?? null
  } catch {
    return null
  }
}
