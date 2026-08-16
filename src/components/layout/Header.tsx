'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { springGentle } from '@/lib/motion'
import { cn } from '@/lib/cn'

type NavChild = { href: string; label: string; external?: boolean }
type NavItem = { label: string; href?: string; children?: NavChild[] }

const nav: NavItem[] = [
  {
    label: 'Owners',
    children: [
      { href: '/owners', label: 'Owner Services' },
      { href: '/tools', label: 'Investor Tools' },
      { href: '/owner-portal', label: 'Owner Login' },
    ],
  },
  {
    label: 'Tenants',
    children: [
      { href: '/tenants', label: 'For Tenants' },
      { href: '/listings', label: 'Available Rentals' },
      {
        href: 'https://highdesertpm.appfolio.com/connect/users/sign_in',
        label: 'Tenant Portal',
        external: true,
      },
    ],
  },
  { label: 'Areas', href: '/market-areas' },
  { label: 'AI Agents', href: '/ai-agents' },
  {
    label: 'About',
    children: [
      { href: '/about', label: 'About Us' },
      { href: '/blog', label: 'Blog' },
      { href: '/contact', label: 'Contact' },
    ],
  },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

  const groupActive = (item: NavItem) =>
    item.children?.some((c) => !c.external && isActive(c.href)) ?? false

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full glass-dark text-white transition-all duration-300',
        scrolled && 'border-b border-white/10 shadow-md',
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="group flex items-center">
          <Image
            src="/logo-white-text.png"
            alt="High Desert Property Management"
            width={200}
            height={48}
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) =>
            item.children ? (
              <div key={item.label} className="group relative">
                <button
                  type="button"
                  aria-haspopup="true"
                  className={cn(
                    'inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-accent group-focus-within:text-accent',
                    groupActive(item) ? 'text-accent' : 'text-white/90',
                  )}
                >
                  {item.label}
                  <ChevronIcon />
                </button>
                {/* Panel — pt-2 keeps the hover bridge gapless */}
                <div className="invisible absolute left-0 top-full pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100">
                  <div className="min-w-[210px] rounded-xl border border-white/10 bg-primary p-1.5 shadow-xl">
                    {item.children.map((child) =>
                      child.external ? (
                        <a
                          key={child.href + child.label}
                          href={child.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg px-3 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 hover:text-accent"
                        >
                          {child.label}
                        </a>
                      ) : (
                        <Link
                          key={child.href}
                          href={child.href}
                          aria-current={isActive(child.href) ? 'page' : undefined}
                          className={cn(
                            'block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 hover:text-accent',
                            isActive(child.href) ? 'text-accent' : 'text-white/90',
                          )}
                        >
                          {child.label}
                        </Link>
                      ),
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href!}
                aria-current={isActive(item.href!) ? 'page' : undefined}
                className={cn(
                  'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-accent active:bg-white/10',
                  isActive(item.href!) ? 'text-accent' : 'text-white/90',
                )}
              >
                {item.label}
                {isActive(item.href!) && (
                  <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
                )}
              </Link>
            ),
          )}
          <Button href="/owners#get-started" variant="primary" size="md" className="ml-3">
            Free Rental Analysis
          </Button>
        </nav>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="relative z-50 flex h-10 w-10 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 active:bg-white/20 lg:hidden"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileOpen}
        >
          <div className="flex w-5 flex-col items-center justify-center gap-[5px]">
            <span
              className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                mobileOpen ? 'translate-y-[7px] rotate-45' : ''
              }`}
            />
            <span
              className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                mobileOpen ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-[2px] w-5 rounded-full bg-current transition-all duration-300 ${
                mobileOpen ? '-translate-y-[7px] -rotate-45' : ''
              }`}
            />
          </div>
        </button>
      </div>

      {/* Mobile Overlay */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile Slide-out Menu — spring slide; opacity-only under reduced motion */}
      <motion.nav
        initial={false}
        animate={
          reduceMotion
            ? { x: 0, opacity: mobileOpen ? 1 : 0 }
            : { x: mobileOpen ? 0 : '100%', opacity: 1 }
        }
        transition={reduceMotion ? { duration: 0.2 } : springGentle}
        className={cn(
          'fixed top-0 right-0 z-40 flex h-full w-[280px] max-w-[80vw] translate-x-full flex-col bg-primary shadow-xl lg:hidden',
          !mobileOpen && 'pointer-events-none',
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="flex-1 overflow-y-auto px-6 pt-20 pb-8">
          <div className="flex flex-col gap-1">
            {nav.map((item) =>
              item.children ? (
                <div key={item.label} className="pt-3 first:pt-0">
                  <p className="px-3 pb-1 text-xs font-semibold uppercase tracking-wide text-white/40">
                    {item.label}
                  </p>
                  {item.children.map((child) =>
                    child.external ? (
                      <a
                        key={child.href + child.label}
                        href={child.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setMobileOpen(false)}
                        className="block rounded-lg px-3 py-2.5 text-base font-medium text-white/90 transition-colors hover:text-accent active:bg-white/10"
                      >
                        {child.label}
                      </a>
                    ) : (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={() => setMobileOpen(false)}
                        aria-current={isActive(child.href) ? 'page' : undefined}
                        className={cn(
                          'block rounded-lg px-3 py-2.5 text-base font-medium transition-colors hover:text-accent active:bg-white/10',
                          isActive(child.href) ? 'text-accent' : 'text-white/90',
                        )}
                      >
                        {child.label}
                      </Link>
                    ),
                  )}
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href!}
                  onClick={() => setMobileOpen(false)}
                  aria-current={isActive(item.href!) ? 'page' : undefined}
                  className={cn(
                    'rounded-lg px-3 py-3 text-base font-medium transition-colors hover:text-accent active:bg-white/10',
                    isActive(item.href!) ? 'text-accent' : 'text-white/90',
                  )}
                >
                  {item.label}
                </Link>
              ),
            )}
          </div>
          <div className="mt-6 space-y-3 border-t border-white/10 pt-6">
            <Button
              href="/owners#get-started"
              variant="primary"
              size="md"
              className="w-full"
              onClick={() => setMobileOpen(false)}
            >
              Free Rental Analysis
            </Button>
          </div>
          <div className="mt-8 space-y-3 text-sm text-white/60">
            <a
              href="tel:+15415480383"
              className="flex items-center gap-2 transition-colors hover:text-accent"
            >
              <PhoneIcon />
              (541) 548-0383
            </a>
            <a
              href="mailto:info@highdesertpm.com"
              className="flex items-center gap-2 transition-colors hover:text-accent"
            >
              <EmailIcon />
              info@highdesertpm.com
            </a>
          </div>
        </div>
      </motion.nav>
    </header>
  )
}

function ChevronIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5 transition-transform duration-200 group-hover:rotate-180 group-focus-within:rotate-180 motion-reduce:transform-none"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.168l3.71-3.938a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 15.352V16.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z"
        clipRule="evenodd"
      />
    </svg>
  )
}

function EmailIcon() {
  return (
    <svg aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.161V6a2 2 0 0 0-2-2H3Z" />
      <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
    </svg>
  )
}
