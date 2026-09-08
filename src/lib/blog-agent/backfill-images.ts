/**
 * Bulk (re)assignment of blog featured images from Unsplash. Powers the admin
 * "Refresh Blog Images" automation. Runs in-process (prod runtime) rather than
 * as a one-off script so it uses the app's managed DB pool.
 *
 * For each post it derives a concise, relevant image query from the title/tags
 * and calls findAndAttachFeaturedImage (Unsplash-first, Wikimedia fallback),
 * which repoints the post's featuredImage. The previous media row is left in the
 * library untouched, so any single post can be reverted by hand.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { findAndAttachFeaturedImage } from './image'
import { CURATED_BLOG_IMAGES } from './curated-blog-images'

export interface ApplyCuratedResult {
  ok: boolean
  updated: number
  failed: number
  details: Array<{ postId: number; ok: boolean; mediaId?: number; error?: string }>
}

/**
 * Apply the hand-curated featured images (see curated-blog-images.ts). Downloads
 * each image directly from the Unsplash CDN (no search API → no rate limit),
 * imports it to Media, and repoints the post's featuredImage. Best-effort per
 * post so one failure never aborts the batch.
 */
export async function applyCuratedBlogImages(): Promise<ApplyCuratedResult> {
  const payload = await getPayload({ config })
  const details: ApplyCuratedResult['details'] = []
  let updated = 0
  let failed = 0

  for (const item of CURATED_BLOG_IMAGES) {
    try {
      const res = await fetch(item.imageUrl, {
        headers: { 'User-Agent': 'HDPM-Web/1.0 (info@highdesertpm.com)' },
      })
      if (!res.ok) throw new Error(`download HTTP ${res.status}`)
      const buffer = Buffer.from(await res.arrayBuffer())
      const contentType = res.headers.get('content-type') || 'image/jpeg'
      const ext = contentType.includes('png') ? '.png' : '.jpg'
      const cleanName =
        item.alt.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) + ext

      const media = await (payload.create as Function)({
        collection: 'media',
        data: {
          alt: item.alt,
          attribution: item.attribution,
          license: 'Unsplash License',
          sourceUrl: item.imageUrl,
        },
        file: { data: buffer, name: cleanName, mimetype: contentType, size: buffer.length },
      })
      await payload.update({ collection: 'posts', id: item.postId, data: { featuredImage: media.id } })
      updated++
      details.push({ postId: item.postId, ok: true, mediaId: media.id })
    } catch (err) {
      failed++
      details.push({ postId: item.postId, ok: false, error: err instanceof Error ? err.message : String(err) })
    }
  }

  return { ok: true, updated, failed, details }
}

// Words that add nothing to an image search — stripped so the query is the
// concrete subject (e.g. "property management company redmond").
const FILLER = new Set([
  'how', 'to', 'what', 'look', 'for', 'a', 'an', 'the', 'your', 'you', 'guide',
  'complete', 'ways', 'tips', 'tip', 'best', 'of', 'and', 'in', 'on', 'with',
  'should', 'know', 'everything', 'about', 'why', 'when', 'choose', 'choosing',
  'need', 'this', 'that', 'from', 'into', 'out',
])

/** Concise, relevant Unsplash query from a post title (falling back to its first tag). */
export function imageQueryForPost(title: string, tags: string[]): string {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !FILLER.has(w))
  const q = words.slice(0, 6).join(' ').trim()
  return q || tags.find(Boolean) || 'Central Oregon home'
}

export interface BackfillResult {
  ok: boolean
  processed: number
  updated: number
  failed: number
  details: Array<{ id: number; title: string; query: string; image: string | null }>
}

/**
 * @param onlyMissing when true, only posts without a featured image are touched.
 *                     Default false = refresh every post.
 */
export async function refreshFeaturedImages(onlyMissing = false): Promise<BackfillResult> {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'posts',
    limit: 300,
    depth: 0,
    sort: '-createdAt',
  })

  const details: BackfillResult['details'] = []
  let updated = 0
  let failed = 0
  let processed = 0

  for (const post of docs as unknown as Array<Record<string, unknown>>) {
    const id = post.id as number
    const title = String(post.title ?? '')
    if (onlyMissing && post.featuredImage) continue
    processed++

    const tags = Array.isArray(post.tags)
      ? (post.tags as Array<{ tag?: string }>).map((t) => t.tag ?? '').filter(Boolean)
      : []
    const query = imageQueryForPost(title, tags)

    try {
      const image = await findAndAttachFeaturedImage(id, query, title)
      if (image) updated++
      else failed++
      details.push({ id, title, query, image: image ? `${image.title} (${image.license})` : null })
    } catch (err) {
      failed++
      details.push({ id, title, query, image: `error: ${err instanceof Error ? err.message : String(err)}` })
    }
  }

  return { ok: true, processed, updated, failed, details }
}
