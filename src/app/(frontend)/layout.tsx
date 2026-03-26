import { Plus_Jakarta_Sans, Inter } from 'next/font/google'

import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'
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
    <div
      className={`${plusJakarta.variable} ${inter.variable} flex min-h-screen flex-col font-body text-neutral-dark antialiased`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}
