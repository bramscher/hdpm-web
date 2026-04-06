import Image from 'next/image'
import Link from 'next/link'

const quickLinks = [
  { href: '/owners', label: 'Property Owners' },
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
              your investment while keeping tenants happy since 2003.
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
                <dd>9:00 AM - 5:00 PM</dd>
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
