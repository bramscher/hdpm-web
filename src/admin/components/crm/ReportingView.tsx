'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: string
  source?: string
  status?: string
  preferredLanguage?: string
}

interface Task {
  id: string
  assignedTo?: { email?: string; id?: string } | string
  status?: string
}

const ACCENT = '#2ECC52'
const BORDER = '#e5e7eb'
const GRAY_50 = '#f9fafb'
const GRAY_500 = '#6b7280'
const GRAY_900 = '#111827'

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  attempted_contact: 'Attempted Contact',
  engaged: 'Engaged',
  tour_scheduled: 'Tour Scheduled',
  toured: 'Toured',
  applied: 'Applied',
  approved: 'Approved',
  leased: 'Leased',
  lost: 'Lost',
  archived: 'Archived',
}

const SOURCE_LABELS: Record<string, string> = {
  zillow: 'Zillow',
  apartments_com: 'Apartments.com',
  website: 'Website',
  facebook: 'Facebook',
  instagram: 'Instagram',
  phone: 'Phone',
  walk_in: 'Walk-in',
  referral: 'Referral',
  other: 'Other',
}

function groupBy<T>(items: T[], key: (item: T) => string): Record<string, number> {
  const result: Record<string, number> = {}
  for (const item of items) {
    const k = key(item) || '(none)'
    result[k] = (result[k] || 0) + 1
  }
  return result
}

function getUserName(user: { email?: string; id?: string } | string | undefined): string {
  if (!user) return '(unassigned)'
  if (typeof user === 'string') return user
  return user.email || '(unknown)'
}

export default function ReportingView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [leadsRes, tasksRes] = await Promise.all([
        fetch('/api/leads?limit=500&depth=0'),
        fetch('/api/lead-tasks?where[status][in]=open,in_progress&limit=200&depth=1'),
      ])
      if (!leadsRes.ok || !tasksRes.ok) throw new Error('Failed to fetch data')
      const leadsData = await leadsRes.json()
      const tasksData = await tasksRes.json()
      setLeads(leadsData.docs ?? [])
      setTasks(tasksData.docs ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load reporting data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const bySource = groupBy(leads, (l) => l.source || '(none)')
  const byStatus = groupBy(leads, (l) => l.status || '(none)')
  const englishCount = leads.filter((l) => l.preferredLanguage === 'en' || !l.preferredLanguage).length
  const spanishCount = leads.filter((l) => l.preferredLanguage === 'es').length
  const byUser = groupBy(tasks, (t) => getUserName(t.assignedTo as { email?: string } | string | undefined))

  // Sort descending by count
  const sortedSource = Object.entries(bySource).sort((a, b) => b[1] - a[1])
  const sortedStatus = Object.entries(byStatus).sort((a, b) => b[1] - a[1])
  const sortedUser = Object.entries(byUser).sort((a, b) => b[1] - a[1])

  function renderTable(title: string, data: [string, number][], labelMap?: Record<string, string>) {
    const total = data.reduce((sum, [, count]) => sum + count, 0)
    return (
      <div
        style={{
          background: '#fff',
          border: `1px solid ${BORDER}`,
          borderRadius: '8px',
          padding: '20px',
        }}
      >
        <h2 style={{ fontSize: '16px', fontWeight: 600, color: GRAY_900, margin: '0 0 16px 0' }}>{title}</h2>
        {data.length === 0 ? (
          <div style={{ color: GRAY_500, fontSize: '13px' }}>No data</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr>
                <th
                  style={{
                    textAlign: 'left',
                    padding: '8px 8px',
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: GRAY_500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {title.replace(/^.*by\s+/i, '').replace(/\s*\(.*/, '')}
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '8px 8px',
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: GRAY_500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '80px',
                  }}
                >
                  Count
                </th>
                <th
                  style={{
                    textAlign: 'right',
                    padding: '8px 8px',
                    borderBottom: `1px solid ${BORDER}`,
                    fontSize: '11px',
                    fontWeight: 600,
                    color: GRAY_500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    width: '80px',
                  }}
                >
                  %
                </th>
              </tr>
            </thead>
            <tbody>
              {data.map(([key, count]) => (
                <tr key={key}>
                  <td style={{ padding: '8px 8px', borderBottom: `1px solid ${GRAY_50}`, fontWeight: 500, color: GRAY_900 }}>
                    {labelMap?.[key] || key}
                  </td>
                  <td style={{ padding: '8px 8px', borderBottom: `1px solid ${GRAY_50}`, textAlign: 'right', fontWeight: 600, color: GRAY_900 }}>
                    {count}
                  </td>
                  <td style={{ padding: '8px 8px', borderBottom: `1px solid ${GRAY_50}`, textAlign: 'right', color: GRAY_500 }}>
                    {total > 0 ? `${Math.round((count / total) * 100)}%` : '--'}
                  </td>
                </tr>
              ))}
              <tr>
                <td style={{ padding: '8px 8px', fontWeight: 700, color: GRAY_900, borderTop: `2px solid ${BORDER}` }}>
                  Total
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: GRAY_900, borderTop: `2px solid ${BORDER}` }}>
                  {total}
                </td>
                <td style={{ padding: '8px 8px', textAlign: 'right', fontWeight: 700, color: GRAY_500, borderTop: `2px solid ${BORDER}` }}>
                  100%
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ padding: '40px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            color: '#991b1b',
          }}
        >
          Error: {error}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'system-ui, -apple-system, sans-serif', maxWidth: '1200px' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: GRAY_900, margin: 0 }}>CRM Reporting</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
          <a
            href="/admin/crm"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: GRAY_900,
              backgroundColor: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: '6px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            Dashboard
          </a>
          <a
            href="/admin/crm/inbox"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#fff',
              backgroundColor: ACCENT,
              borderRadius: '6px',
              textDecoration: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Inbox
          </a>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY_500, fontSize: '14px' }}>
          Loading reports...
        </div>
      )}

      {!loading && (
        <>
          {/* Summary strip */}
          <div
            style={{
              display: 'flex',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                flex: 1,
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 500, color: GRAY_500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Total Leads
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: ACCENT }}>{leads.length}</div>
            </div>
            <div
              style={{
                flex: 1,
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 500, color: GRAY_500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                English
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: GRAY_900 }}>{englishCount}</div>
            </div>
            <div
              style={{
                flex: 1,
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 500, color: GRAY_500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Spanish
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: GRAY_900 }}>{spanishCount}</div>
            </div>
            <div
              style={{
                flex: 1,
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '20px',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 500, color: GRAY_500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
                Open Tasks
              </div>
              <div style={{ fontSize: '28px', fontWeight: 700, color: tasks.length > 0 ? '#ef4444' : GRAY_900 }}>
                {tasks.length}
              </div>
            </div>
          </div>

          {/* Two-column grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {renderTable('Leads by Source', sortedSource, SOURCE_LABELS)}
            {renderTable('Leads by Status', sortedStatus, STATUS_LABELS)}
            {renderTable('Open Tasks by User', sortedUser)}
          </div>
        </>
      )}
    </div>
  )
}
