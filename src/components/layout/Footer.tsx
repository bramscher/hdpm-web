import Image from 'next/image'
import Link from 'next/link'
import { FOUNDED_YEAR } from '@/lib/constants'

const quickLinks = [
  { href: '/owners', label: 'Property Owners' },
  { href: '/owner-portal', label: 'Owner Login' },
  { href: '/tenants', label: 'Current Tenants' },
  { href: '/listings', label: 'Available Rentals' },
  { href: '/about', label: 'About Us' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

const marketAreas = [
  { href: '/market-areas/bend', label: 'Bend' },
  { href: '/market-areas/redmond', label: 'Redmond' },
  { href: '/market-areas/sisters', label: 'Sisters' },
  { href: '/market-areas/prineville', label: 'Prineville' },
  { href: '/market-areas/culver', label: 'Culver' },
  { href: '/market-areas/metolius', label: 'Metolius' },
  { href: '/market-areas/madras', label: 'Madras' },
]

export default function Footer() {
  return (
    <footer className="bg-primary text-gray-300">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {/* Company Info */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="mb-4">
              <Image
                src="/logo-white-text.png"
                alt="High Desert Property Management"
                width={180}
                height={44}
              />
            </div>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-gray-400">
              Professional property management across Central Oregon. Maximizing
              your investment while keeping tenants happy since {FOUNDED_YEAR}.
            </p>
            <address className="space-y-2 text-sm not-italic text-gray-400">
              <p>1515 SW Reindeer Ave</p>
              <p>Redmond, OR 97756</p>
              <a
                href="tel:+15415480383"
                className="block transition-colors hover:text-accent"
              >
                (541) 548-0383
              </a>
              <a
                href="mailto:info@highdesertpm.com"
                className="block transition-colors hover:text-accent"
              >
                info@highdesertpm.com
              </a>
            </address>
            <a
              href="https://www.instagram.com/highdesertpm/"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-accent"
              aria-label="Follow High Desert Property Management on Instagram"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
              </svg>
              @highdesertpm
            </a>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-accent uppercase">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition-colors hover:text-accent"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Market Areas */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-accent uppercase">
              Areas We Serve
            </h3>
            <ul className="space-y-2.5">
              {marketAreas.map((area) => (
                <li key={area.href}>
                  <Link
                    href={area.href}
                    className="text-sm text-gray-400 transition-colors hover:text-accent"
                  >
                    {area.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact / Hours */}
          <div>
            <h3 className="mb-4 text-sm font-semibold tracking-wider text-accent uppercase">
              Office Hours
            </h3>
            <dl className="space-y-2.5 text-sm text-gray-400">
              <div>
                <dt className="font-medium text-gray-300">Monday - Friday</dt>
                <dd>9:00 AM - 4:00 PM</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-300">Saturday - Sunday</dt>
                <dd>Closed</dd>
              </div>
              <div className="pt-2">
                <dt className="font-medium text-gray-300">
                  Emergency Maintenance
                </dt>
                <dd>24/7 Online Portal</dd>
              </div>
            </dl>
            <div className="mt-6">
              <Link
                href="/owners#get-started"
                className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-accent-dark hover:shadow-md"
              >
                Free Rental Analysis
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Fair Housing */}
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-sm leading-relaxed text-gray-500">
            <span className="font-semibold text-gray-400">
              Equal Housing Opportunity.
            </span>{' '}
            We do business in accordance with the federal{' '}
            <a
              href="https://www.hud.gov/program_offices/fair_housing_equal_opp"
              target="_blank"
              rel="noopener noreferrer"
              className="underline transition-colors hover:text-accent"
            >
              Fair Housing Act
            </a>{' '}
            and Oregon fair housing laws. We do not discriminate on the basis
            of race, color, religion, sex, disability, familial status,
            national origin, or any other protected class.
          </p>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} High Desert Property Management.
            All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link
              href="/privacy"
              className="transition-colors hover:text-accent"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="transition-colors hover:text-accent"
            >
              Terms of Service
            </Link>
            <Link
              href="/accessibility"
              className="transition-colors hover:text-accent"
            >
              Accessibility
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
