'use client'

import React from 'react'
import Link from 'next/link'

export default function CrmNavLink() {
  return (
    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '8px', marginTop: '4px' }}>
      <Link
        href="/admin/crm"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'inherit',
          textDecoration: 'none',
          opacity: 0.8,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.8' }}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        CRM Dashboard
      </Link>
      <Link
        href="/admin/crm/inbox"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px 6px 40px',
          fontSize: '12px',
          color: 'inherit',
          textDecoration: 'none',
          opacity: 0.6,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6' }}
      >
        Inbox / Follow-up
      </Link>
      <Link
        href="/admin/crm/reporting"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 16px 6px 40px',
          fontSize: '12px',
          color: 'inherit',
          textDecoration: 'none',
          opacity: 0.6,
          transition: 'opacity 0.15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '1' }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.6' }}
      >
        Reporting
      </Link>
    </div>
  )
}
