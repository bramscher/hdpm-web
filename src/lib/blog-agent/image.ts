/**
 * Featured-image selection for generated blog posts. Searches Unsplash first
 * (purpose-built stock: homes, keys, Oregon landscapes) and falls back to
 * Wikimedia Commons, picking the best license-safe landscape photo, importing
 * it into the Media collection, and attaching it to the post.
 */

import { getPayload } from 'payload'
import config from '@payload-config'
import { searchUnsplash, searchWikimedia, type SearchResult } from '@/lib/image-search'

const ALLOWED_IMPORT_HOSTS = new Set([
  'upload.wikimedia.org',
  'commons.wikimedia.org',
  'images.unsplash.com',
])

// Unsplash images are free-to-use under the Unsplash License; Wikimedia results
// must carry a CC / public-domain / attribution license.
const SAFE_LICENSE = /(^|\b)(cc[- ]|cc0|public domain|pd|attribution|unsplash)/i

function isUsable(r: SearchResult): boolean {
  if (!SAFE_LICENSE.test(r.license)) return false
  if (r.width < 1000 || r.width <= r.height) return false
  // Unsplash URLs (images.unsplash.com/photo-...) carry no file extension —
  // the host always serves JPEG, so trust the source instead of the path.
  if (r.source === 'unsplash') return true
  // Wikimedia appends ?utm_* params — check the extension on the path only.
  return /\.(jpe?g|png)(\?|$)/i.test(r.url)
}

function pickBest(results: SearchResult[]): SearchResult | null {
  // Search relevance order is already good — take the first usable landscape.
  return results.find(isUsable) ?? null
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
    // Try the topic-specific query on Unsplash then Wikimedia, then broaden to a
    // generic Central Oregon query on each. First usable hit wins.
    const attempts: Array<() => Promise<SearchResult[]>> = [
      () => searchUnsplash(query, 1),
      () => searchWikimedia(query, 1),
      () => searchUnsplash('Central Oregon home', 1),
      () => searchWikimedia('Bend Oregon', 1),
    ]
    let best: SearchResult | null = null
    for (const attempt of attempts) {
      best = pickBest(await attempt())
      if (best) break
    }
    if (!best) return null

    const parsedUrl = new URL(best.url)
    if (parsedUrl.protocol !== 'https:' || !ALLOWED_IMPORT_HOSTS.has(parsedUrl.hostname)) {
      return null
    }
    if (best.source === 'unsplash') {
      // Request a sensible web-sized JPEG rather than the full-res original.
      parsedUrl.searchParams.set('w', '1920')
      parsedUrl.searchParams.set('q', '80')
      parsedUrl.searchParams.set('fm', 'jpg')
      // Unsplash API guidelines: trigger the download endpoint when a photo is
      // used. Fire-and-forget — never block or fail the import on it.
      const unsplashKey = process.env.UNSPLASH_ACCESS_KEY
      if (best.downloadUrl && unsplashKey) {
        void fetch(best.downloadUrl, {
          headers: { Authorization: `Client-ID ${unsplashKey}` },
        }).catch(() => {})
      }
    } else {
      // Wikimedia: strip utm tracking params before downloading/storing.
      parsedUrl.search = ''
    }
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
