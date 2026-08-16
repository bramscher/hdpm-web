'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, useReducedMotion } from 'motion/react'
import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'
import { springGentle } from '@/lib/motion'
import { cn } from '@/lib/cn'

const navLinks = [
  { href: '/owners', label: 'For Owners' },
  { href: '/tenants', label: 'For Tenants' },
  { href: '/listings', label: 'Listings' },
  { href: '/market-areas', label: 'Areas' },
  { href: '/ai-agents', label: 'AI Agents' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/contact', label: 'Contact' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const reduceMotion = useReducedMotion()

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`)

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
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={cn(
                'relative rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:text-accent active:bg-white/10',
                isActive(link.href) ? 'text-accent' : 'text-white/90',
              )}
            >
              {link.label}
              {isActive(link.href) && (
                <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </Link>
          ))}
          <Button
            href="/owner-portal"
            variant="outline-light"
            size="sm"
            className="ml-3"
          >
            Owner Login
          </Button>
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={cn(
                  'rounded-lg px-3 py-3 text-base font-medium transition-colors hover:text-accent active:bg-white/10',
                  isActive(link.href) ? 'text-accent' : 'text-white/90',
                )}
              >
                {link.label}
              </Link>
            ))}
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
            <Button
              href="/owner-portal"
              variant="outline-light"
              size="md"
              className="w-full"
              onClick={() => setMobileOpen(false)}
            >
              Owner Login
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
