import React from 'react'

/**
 * "Sign in with Microsoft 365" button rendered above the Payload admin login
 * form (via `admin.components.beforeLogin`). A plain link to the payload-oauth2
 * authorize endpoint — `/api/users/oauth/authorize` — which 302s to Microsoft.
 * Email + password login stays below it as the break-glass path.
 *
 * Server component: no client JS needed, it's just a styled anchor.
 */
export default function MicrosoftLoginButton() {
  return (
    <div style={{ marginBottom: 'calc(var(--base) * 1.5)' }}>
      <a
        href="/api/users/oauth/authorize"
        className="btn btn--style-primary btn--size-medium"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          width: '100%',
          textDecoration: 'none',
        }}
      >
        {/* Microsoft four-square logo */}
        <svg width="18" height="18" viewBox="0 0 21 21" aria-hidden="true">
          <rect x="1" y="1" width="9" height="9" fill="#f25022" />
          <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
          <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
          <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
        </svg>
        Sign in with Microsoft 365
      </a>
      <div
        style={{
          textAlign: 'center',
          margin: 'calc(var(--base) * 0.75) 0',
          color: 'var(--theme-elevation-400)',
          fontSize: '0.8rem',
        }}
      >
        or sign in with email
      </div>
    </div>
  )
}
