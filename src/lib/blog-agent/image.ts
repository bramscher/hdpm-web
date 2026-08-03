/**
 * Featured-image selection for generated blog posts: searches Wikimedia
 * Commons with the model-suggested query, picks the best license-safe
 * landscape photo, imports it into the Media collection, and attaches it
 * to the post.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { searchWikimedia, type SearchResult } from '@/lib/image-search'

const ALLOWED_IMPORT_HOSTS = new Set(['upload.wikimedia.org', 'commons.wikimedia.org'])

const SAFE_LICENSE = /(^|\b)(cc[- ]|cc0|public domain|pd|attribution)/i

function pickBest(results: SearchResult[]): SearchResult | null {
  const candidates = results.filter(
    (r) =>
      SAFE_LICENSE.test(r.license) &&
      r.width >= 1000 &&
      r.width > r.height &&
      // Wikimedia appends ?utm_* params — check the extension on the path only
      /\.(jpe?g|png)(\?|$)/i.test(r.url),
  )
  // Wikimedia search relevance order is already good — take the first
  // sufficiently-large landscape photo with a clear license.
  return candidates[0] ?? null
}

export interface AttachedImage {
  mediaId: number
  title: string
  attribution: string
  license: string
  sourceUrl: string
}

/**
 * Best-effort: returns null (never throws) when no suitable image is found
 * or the import fails — an image-less draft is still useful.
 */
export async function findAndAttachFeaturedImage(
  postId: number,
  query: string,
  alt: string,
): Promise<AttachedImage | null> {
  try {
    let results = await searchWikimedia(query, 1)
    let best = pickBest(results)
    if (!best) {
      // Broaden: retry with a Central Oregon fallback query
      results = await searchWikimedia('Bend Oregon', 1)
      best = pickBest(results)
    }
    if (!best) return null

    const parsedUrl = new URL(best.url)
    if (parsedUrl.protocol !== 'https:' || !ALLOWED_IMPORT_HOSTS.has(parsedUrl.hostname)) {
      return null
    }
    // Strip Wikimedia's utm tracking params before downloading/storing
    parsedUrl.search = ''
    best.url = parsedUrl.toString()

    const res = await fetch(best.url, {
      headers: { 'User-Agent': 'HDPM-Web/1.0 (info@highdesertpm.com)' },
    })
    if (!res.ok) return null

    const buffer = Buffer.from(await res.arrayBuffer())
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const ext = contentType.includes('png') ? '.png' : '.jpg'
    const cleanName =
      alt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60) + ext

    const payload = await getPayload({ config })
    const media = await (payload.create as Function)({
      collection: 'media',
      data: {
        alt,
        attribution: best.attribution,
        license: best.license,
        sourceUrl: best.url,
      },
      file: {
        data: buffer,
        name: cleanName,
        mimetype: contentType,
        size: buffer.length,
      },
    })

    await payload.update({
      collection: 'posts',
      id: postId,
      data: { featuredImage: media.id },
    })

    return {
      mediaId: media.id,
      title: best.title,
      attribution: best.attribution,
      license: best.license,
      sourceUrl: best.url,
    }
  } catch (err) {
    console.warn('[blog-agent] featured image step failed:', err)
    return null
  }
}
