import type { Metadata } from 'next'
import React from 'react'

export const metadata: Metadata = {
  title: {
    default: 'High Desert Property Management | Central Oregon',
    template: '%s | High Desert Property Management',
  },
  description:
    'Professional property management in Bend, Redmond, Sisters, Prineville, Culver, Metolius & Madras. Trusted by Central Oregon property owners since 2003.',
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || 'https://highdesertpm.com',
  ),
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
