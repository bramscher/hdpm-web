import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

/**
 * On-demand Next.js cache invalidation for CMS content.
 *
 * Most frontend routes (`/[slug]`, `/`, `/market-areas/[slug]`, and the
 * dedicated `/contact`, `/listings`, `/tenants` pages) are statically
 * generated with no `revalidate`, so a database change — whether a manual CMS
 * edit or an applied SEO suggestion — never reaches the live page until the
 * next deploy. These hooks call `revalidatePath` on save/delete so the change
 * shows up on the next request instead. Routes already marked `force-dynamic`
 * (blog posts, /about, /owners) are unaffected; a redundant revalidate is a
 * harmless no-op.
 */

type Doc = { slug?: string | null } | null | undefined

/** Frontend path(s) a given CMS document renders at. */
function pathsFor(collection: string, doc: Doc): string[] {
  const slug = doc?.slug
  switch (collection) {
    case 'pages':
      if (!slug) return []
      // The `home` page doc is served at `/`, not `/home`.
      return slug === 'home' ? ['/'] : [`/${slug}`]
    case 'posts':
      return slug ? [`/blog/${slug}`, '/blog'] : ['/blog']
    case 'market-areas':
      return slug ? [`/market-areas/${slug}`, '/market-areas'] : ['/market-areas']
    default:
      return []
  }
}

function revalidateDoc(
  collection: string,
  doc: Doc,
  logger?: { info: (m: string) => void; warn: (m: string) => void },
) {
  for (const path of pathsFor(collection, doc)) {
    try {
      revalidatePath(path)
      logger?.info(`[revalidate] ${collection} → ${path}`)
    } catch (err) {
      // `revalidatePath` throws outside a request scope (e.g. a standalone
      // migration script). A save must never fail because the cache couldn't
      // be busted — log and move on.
      logger?.warn(
        `[revalidate] skipped ${path}: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
  }
}

/**
 * afterChange/afterDelete hooks that revalidate the affected frontend path(s).
 * Spread the result into a collection's `hooks`:
 *
 *   hooks: revalidateHooks('pages')
 */
export function revalidateHooks(collection: string): {
  afterChange: CollectionAfterChangeHook[]
  afterDelete: CollectionAfterDeleteHook[]
} {
  const afterChange: CollectionAfterChangeHook = ({ doc, previousDoc, req }) => {
    revalidateDoc(collection, doc as Doc, req?.payload?.logger)
    // If the slug changed, the old URL must be busted too.
    const prevSlug = (previousDoc as Doc)?.slug
    if (prevSlug && prevSlug !== (doc as Doc)?.slug) {
      revalidateDoc(collection, previousDoc as Doc, req?.payload?.logger)
    }
    return doc
  }

  const afterDelete: CollectionAfterDeleteHook = ({ doc, req }) => {
    revalidateDoc(collection, doc as Doc, req?.payload?.logger)
    return doc
  }

  return { afterChange: [afterChange], afterDelete: [afterDelete] }
}
