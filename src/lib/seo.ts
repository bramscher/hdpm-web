import type { Metadata } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://highdesertpm.com'
const SITE_NAME = 'High Desert Property Management'

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

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: ogImage, width: 1200, height: 630 }],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}
