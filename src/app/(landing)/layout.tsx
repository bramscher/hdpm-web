import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import '../globals.css'

import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import AttributionCapture from '@/components/AttributionCapture'

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
  weight: ['500', '600', '700', '800'],
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

/**
 * Layout for ad landing pages (/lp/*): no site header/footer so paid
 * visitors stay on the conversion path. GTM/GA and attribution capture
 * still run so campaign measurement works.
 */
export default function LandingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${inter.variable} flex min-h-screen flex-col font-body text-neutral-dark antialiased`}
      >
        <AttributionCapture />
        <main className="flex-1">{children}</main>
        {process.env.NEXT_PUBLIC_GTM_ID && (
          <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID} />
        )}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID} />
        )}
      </body>
    </html>
  )
}
