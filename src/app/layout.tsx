import type { Metadata } from 'next'
import React from 'react'
import { SITE_URL } from '@/lib/site-url'
import { FOUNDED_YEAR } from '@/lib/constants'

const DEFAULT_TITLE = 'High Desert Property Management | Central Oregon'
const DEFAULT_DESCRIPTION = `Professional property management in Bend, Redmond, Sisters, Prineville, Culver, Metolius & Madras. Trusted by Central Oregon property owners since ${FOUNDED_YEAR}.`

export const metadata: Metadata = {
  title: {
    default: DEFAULT_TITLE,
    template: '%s | High Desert Property Management',
  },
  description: DEFAULT_DESCRIPTION,
  metadataBase: new URL(SITE_URL),
  // Site-wide defaults so any page without its own social card still shares a
  // branded preview. Pages that set their own openGraph/twitter override these.
  openGraph: {
    type: 'website',
    siteName: 'High Desert Property Management',
    url: SITE_URL,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [{ url: '/og-default.jpg', width: 1200, height: 630, alt: DEFAULT_TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ['/og-default.jpg'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
