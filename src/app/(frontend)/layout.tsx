import { Plus_Jakarta_Sans, Inter } from 'next/font/google'
import '../globals.css'

import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
import AttributionCapture from '@/components/AttributionCapture'
import { localBusinessSchema } from '@/lib/schema'

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

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = localBusinessSchema()

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakarta.variable} ${inter.variable} flex min-h-screen flex-col font-body text-neutral-dark antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:font-semibold focus:text-white focus:shadow-lg"
        >
          Skip to main content
        </a>
        <AttributionCapture />
        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
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
