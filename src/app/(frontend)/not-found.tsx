import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Page Not Found',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <section className="bg-primary px-4 pb-24 pt-24 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-heading text-6xl font-extrabold text-accent">404</p>
        <h1 className="mt-4 font-heading text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          We couldn&apos;t find that page
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
          The page you&apos;re looking for may have moved. Here are some good
          places to pick back up:
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/listings"
            className="inline-flex items-center justify-center rounded-lg bg-accent px-8 py-4 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-accent-dark hover:shadow-xl hover:-translate-y-0.5"
          >
            Browse Available Rentals
          </Link>
          <Link
            href="/owners"
            className="inline-flex items-center justify-center rounded-lg border border-white/30 px-8 py-4 text-base font-semibold text-white transition-all duration-200 hover:bg-white/10"
          >
            Property Management Services
          </Link>
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
