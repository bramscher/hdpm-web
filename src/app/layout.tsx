import type { Metadata } from 'next'
import React from 'react'
import { SITE_URL } from '@/lib/site-url'
import { FOUNDED_YEAR } from '@/lib/constants'

export const metadata: Metadata = {
  title: {
    default: 'High Desert Property Management | Central Oregon',
    template: '%s | High Desert Property Management',
  },
  description: `Professional property management in Bend, Redmond, Sisters, Prineville, Culver, Metolius & Madras. Trusted by Central Oregon property owners since ${FOUNDED_YEAR}.`,
  metadataBase: new URL(SITE_URL),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
