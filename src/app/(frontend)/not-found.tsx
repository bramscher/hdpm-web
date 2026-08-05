import Link from 'next/link'
import type { Metadata } from 'next'
import Button from '@/components/ui/Button'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <section className="bg-primary px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-heading text-6xl font-extrabold text-accent">404</p>
        <h1 className="mt-4 font-heading text-display-sm sm:text-display text-white">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-body-lg text-white/80">
          The page you&apos;re looking for may have moved. Here are some good
          places to pick back up:
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button href="/listings" variant="primary" size="lg" elevated>
            Browse Available Rentals
          </Button>
          <Button href="/owners" variant="outline-light" size="lg">
            Property Management Services
          </Button>
        </div>
        <p className="mt-8 text-sm text-white/60">
          Still stuck?{' '}
          <Link href="/contact" className="underline hover:text-accent">
            Contact us
          </Link>{' '}
          or call{' '}
          <a href="tel:+15415480383" className="underline hover:text-accent">
            (541) 548-0383
          </a>
          .
        </p>
      </div>
    </section>
  )
}
