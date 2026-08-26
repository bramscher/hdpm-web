import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-url'
const SITE_NAME = 'High Desert Property Management'

/**
 * The root layout (src/app/layout.tsx) applies a
 * `%s | High Desert Property Management` title template, so a page title must
 * NOT carry its own brand suffix or the brand renders twice
 * ("… | High Desert PM | High Desert Property Management"). The SEO agent and
 * some older stored `meta.title` values include one anyway; strip a trailing
 * "| High Desert…" / "- High Desert…" fragment defensively so the template is
 * the single source of the brand. Idempotent — a clean title is returned
 * unchanged.
 */
export function stripBrandSuffix(title: string): string {
  return title
    .replace(/\s*[|\-–—]\s*High Desert(?:\s+(?:PM|Property Management))?\.?\s*$/i, '')
    .trim()
}

export function createMetadata({
  title,
  description,
  path = '',
  image,
}: {
  title: string
  description: string
  path?: string
  image?: string
}): Metadata {
  const url = `${SITE_URL}${path}`
  const ogImage = image || `${SITE_URL}/og-default.jpg`
  const cleanTitle = stripBrandSuffix(title)

  return {
    title: cleanTitle,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: cleanTitle,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: cleanTitle,
      description,
      images: [ogImage],
    },
  }
}
