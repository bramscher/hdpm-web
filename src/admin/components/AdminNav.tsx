'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

/* ------------------------------------------------------------------ */
/*  Icons (Lucide-style, 18×18)                                        */
/* ------------------------------------------------------------------ */

const icons = {
  dashboard: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  image: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="M21 15l-3.086-3.086a2 2 0 00-2.828 0L6 21" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  ),
  inbox: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z" />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  gear: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  star: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  blog: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  home: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  ),
  sync: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2v6h-6" />
      <path d="M2.5 22v-6h6" />
      <path d="M2 11.5a10 10 0 0118.8-4.3" />
      <path d="M22 12.5a10 10 0 01-18.8 4.3" />
    </svg>
  ),
  chevron: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  arrowLeft: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </svg>
  ),
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const css = {
  container: {
    padding: '12px 0 16px',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    marginTop: '4px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '2px',
  },
  sectionLabel: {
    padding: '8px 16px 4px',
    fontSize: '10px',
    fontWeight: 700,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.35)',
    userSelect: 'none' as const,
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '6px 16px',
    fontSize: '13px',
    fontWeight: 600,
    color: 'inherit',
    textDecoration: 'none' as const,
    borderRadius: '6px',
    margin: '0 8px',
    cursor: 'pointer',
    border: 'none',
    background: 'transparent',
    width: 'calc(100% - 16px)',
    transition: 'background 0.15s',
  },
  link: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '5px 16px 5px 44px',
    fontSize: '13px',
    fontWeight: 400,
    color: 'inherit',
    textDecoration: 'none' as const,
    borderRadius: '6px',
    margin: '0 8px',
    transition: 'background 0.15s',
  },
  activeIndicator: {
    position: 'absolute' as const,
    left: '0',
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '16px',
    borderRadius: '0 3px 3px 0',
    background: 'rgba(46,204,82,0.8)',
  },
  dot: {
    width: '5px',
    height: '5px',
    borderRadius: '50%',
    background: 'rgba(255,255,255,0.3)',
    flexShrink: 0,
  },
}

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function NavSection({
  label,
  icon,
  defaultOpen = false,
  children,
}: {
  label: string
  icon: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        style={css.sectionHeader}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ opacity: 0.7, flexShrink: 0, display: 'flex' }}>{icon}</span>
        <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
        <span
          style={{
            opacity: 0.4,
            transition: 'transform 0.2s',
            transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'flex',
          }}
        >
          {icons.chevron}
        </span>
      </button>
      <div
        style={{
          overflow: 'hidden',
          transition: 'max-height 0.25s ease, opacity 0.2s ease',
          maxHeight: open ? '300px' : '0',
          opacity: open ? 1 : 0,
        }}
      >
        <div style={{ padding: '2px 0' }}>{children}</div>
      </div>
    </div>
  )
}

function NavLink({
  href,
  icon,
  children,
  external,
}: {
  href: string
  icon?: React.ReactNode
  children: React.ReactNode
  external?: boolean
}) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname?.startsWith(href + '/')
  const isSubItem = !icon

  return (
    <div style={{ position: 'relative' }}>
      {isActive && <div style={css.activeIndicator} />}
      <Link
        href={href}
        target={external ? '_blank' : undefined}
        rel={external ? 'noopener noreferrer' : undefined}
        style={{
          ...(isSubItem ? css.link : css.sectionHeader),
          opacity: isActive ? 1 : isSubItem ? 0.6 : 0.8,
          fontWeight: isActive ? 600 : isSubItem ? 400 : 600,
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.opacity = isActive ? '1' : isSubItem ? '0.6' : '0.8'
        }}
      >
        {icon && <span style={{ opacity: 0.7, flexShrink: 0, display: 'flex' }}>{icon}</span>}
        {isSubItem && <span style={css.dot} />}
        <span>{children}</span>
      </Link>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function AdminNav() {
  return (
    <div style={css.container}>
      <NavLink href="/admin/campaigns" icon={icons.chart}>
        Campaigns
      </NavLink>
      <NavLink href="/admin/image-browser" icon={icons.image}>
        Image Browser
      </NavLink>
      <NavLink href="/admin/automations" icon={icons.gear}>
        Automations
      </NavLink>
    </div>
  )
}
