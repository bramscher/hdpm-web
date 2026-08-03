'use client'

import React, { useCallback, useEffect, useState } from 'react'

interface CampaignStats {
  id: number
  name: string
  slug: string
  platform: string
  status: string
  landingPage: { title: string; slug: string; status: string } | null
  adUrl: string | null
  visits: number
  visits30d: number
  leads: number
  leads30d: number
  conversionRate: number | null
}

const cellStyle: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: '13px',
  color: 'var(--theme-text, #333)',
  borderBottom: '1px solid var(--theme-elevation-100, #eee)',
  verticalAlign: 'top',
}

const headStyle: React.CSSProperties = {
  ...cellStyle,
  fontWeight: 600,
  fontSize: '12px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: 'var(--theme-elevation-500, #666)',
  whiteSpace: 'nowrap',
}

function StatusPill({ status }: { status: string }) {
  const colors: Record<string, string> = {
    active: 'var(--theme-success-500, #28a745)',
    paused: '#e6a700',
    draft: 'var(--theme-elevation-400, #999)',
    archived: 'var(--theme-elevation-400, #999)',
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 600,
        color: '#fff',
        background: colors[status] || colors.draft,
      }}
    >
      {status}
    </span>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      title={text}
      style={{
        padding: '4px 10px',
        fontSize: '12px',
        fontWeight: 600,
        borderRadius: '6px',
        border: '1px solid var(--theme-elevation-200, #ccc)',
        background: copied ? 'var(--theme-success-500, #28a745)' : 'var(--theme-elevation-50, #fff)',
        color: copied ? '#fff' : 'var(--theme-text, #333)',
        cursor: 'pointer',
        whiteSpace: 'nowrap',
      }}
    >
      {copied ? 'Copied!' : 'Copy ad URL'}
    </button>
  )
}

export default function CampaignsView() {
  const [stats, setStats] = useState<CampaignStats[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/campaigns/stats')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load campaign stats')
      } else {
        setStats(data.campaigns)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '40px 20px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: '24px',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, color: 'var(--theme-text, #333)' }}>
            Campaigns
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: 'var(--theme-elevation-500, #666)' }}>
            Ad campaign performance: landing-page visits, attributed leads, and copy-ready ad URLs
            for Facebook / Instagram Ads Manager.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <a
            href="/admin/collections/landing-pages/create"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              border: '1px solid var(--theme-elevation-200, #ccc)',
              color: 'var(--theme-text, #333)',
              textDecoration: 'none',
            }}
          >
            + Landing page
          </a>
          <a
            href="/admin/collections/campaigns/create"
            style={{
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 600,
              borderRadius: '6px',
              background: 'var(--theme-success-500, #28a745)',
              color: '#fff',
              textDecoration: 'none',
            }}
          >
            + Campaign
          </a>
        </div>
      </div>

      {loading && (
        <p style={{ fontSize: '14px', color: 'var(--theme-elevation-500, #666)' }}>Loading…</p>
      )}
      {error && <p style={{ fontSize: '14px', color: 'var(--theme-error-500, #dc3545)' }}>{error}</p>}

      {!loading && !error && stats && stats.length === 0 && (
        <div
          style={{
            padding: '32px',
            borderRadius: '8px',
            border: '1px dashed var(--theme-elevation-200, #ccc)',
            fontSize: '14px',
            color: 'var(--theme-elevation-500, #666)',
            lineHeight: 1.7,
          }}
        >
          No campaigns yet. The flow:
          <ol style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
            <li>Create a <strong>Landing page</strong> (headline, bullets, form) and publish it</li>
            <li>Create a <strong>Campaign</strong> pointing at it (slug becomes utm_campaign)</li>
            <li>Copy the ad URL from this dashboard into Ads Manager</li>
            <li>Visits and leads show up here automatically</li>
          </ol>
        </div>
      )}

      {!loading && !error && stats && stats.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...headStyle, textAlign: 'left' }}>Campaign</th>
                <th style={{ ...headStyle, textAlign: 'left' }}>Status</th>
                <th style={{ ...headStyle, textAlign: 'left' }}>Landing page</th>
                <th style={{ ...headStyle, textAlign: 'right' }}>Visits 30d</th>
                <th style={{ ...headStyle, textAlign: 'right' }}>Leads 30d</th>
                <th style={{ ...headStyle, textAlign: 'right' }}>Conv %</th>
                <th style={{ ...headStyle, textAlign: 'right' }}>All-time</th>
                <th style={{ ...headStyle, textAlign: 'left' }}>Ad URL</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((c) => (
                <tr key={c.id}>
                  <td style={cellStyle}>
                    <a
                      href={`/admin/collections/campaigns/${c.id}`}
                      style={{ fontWeight: 600, color: 'var(--theme-text, #333)' }}
                    >
                      {c.name}
                    </a>
                    <div style={{ fontSize: '12px', color: 'var(--theme-elevation-500, #666)' }}>
                      {c.platform} · {c.slug}
                    </div>
                  </td>
                  <td style={cellStyle}>
                    <StatusPill status={c.status} />
                  </td>
                  <td style={cellStyle}>
                    {c.landingPage ? (
                      <>
                        <a
                          href={`/lp/${c.landingPage.slug}?utm_campaign=preview`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'var(--theme-text, #333)' }}
                        >
                          {c.landingPage.title}
                        </a>
                        {c.landingPage.status !== 'published' && (
                          <div style={{ fontSize: '12px', color: 'var(--theme-error-500, #dc3545)' }}>
                            not published — page 404s
                          </div>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{c.visits30d}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>{c.leads30d}</td>
                  <td style={{ ...cellStyle, textAlign: 'right' }}>
                    {c.conversionRate === null ? '—' : `${c.conversionRate}%`}
                  </td>
                  <td style={{ ...cellStyle, textAlign: 'right', color: 'var(--theme-elevation-500, #666)' }}>
                    {c.visits} v / {c.leads} l
                  </td>
                  <td style={cellStyle}>{c.adUrl ? <CopyButton text={c.adUrl} /> : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p style={{ marginTop: '20px', fontSize: '12px', color: 'var(--theme-elevation-500, #666)' }}>
        Visits count one per browser session, only for URLs carrying a known utm_campaign. Leads are
        attributed by utm_campaign captured at form submission, so leads can exceed visits if
        someone returns later in a new session.
      </p>
    </div>
  )
}
