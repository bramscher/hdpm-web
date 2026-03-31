'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: string
  firstName?: string
  lastName?: string
  email?: string
  status?: string
  source?: string
  assignedTo?: { email?: string; id?: string } | string
  createdAt?: string
}

interface Task {
  id: string
  title?: string
  lead?: Lead | string
  dueAt?: string
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

const PIPELINE_STATUSES = [
  'new',
  'attempted_contact',
  'engaged',
  'tour_scheduled',
  'toured',
  'applied',
  'approved',
]

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function timeAgo(dateStr?: string): string {
  if (!dateStr) return '--'
  const now = new Date()
  const d = new Date(dateStr)
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return formatDate(dateStr)
}

function getUserName(user: { email?: string; id?: string } | string | undefined): string {
  if (!user) return '--'
  if (typeof user === 'string') return user
  return user.email || '--'
}

function getStatusBadge(status?: string) {
  const colors: Record<string, { bg: string; text: string }> = {
    new: { bg: '#dbeafe', text: '#1e40af' },
    attempted_contact: { bg: '#fef3c7', text: '#92400e' },
    engaged: { bg: '#d1fae5', text: '#065f46' },
    tour_scheduled: { bg: '#ede9fe', text: '#5b21b6' },
    toured: { bg: '#e0e7ff', text: '#3730a3' },
    applied: { bg: '#fce7f3', text: '#9d174d' },
    approved: { bg: '#d1fae5', text: '#065f46' },
    leased: { bg: '#f0fdf4', text: '#166534' },
    lost: { bg: '#fee2e2', text: '#991b1b' },
    archived: { bg: '#f3f4f6', text: '#4b5563' },
  }
  const c = colors[status || ''] || { bg: '#f3f4f6', text: '#4b5563' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '11px',
        fontWeight: 600,
        backgroundColor: c.bg,
        color: c.text,
        textTransform: 'capitalize',
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABELS[status || ''] || status || '--'}
    </span>
  )
}

async function fetchCount(url: string): Promise<number> {
  try {
    const res = await fetch(url)
    if (!res.ok) return 0
    const data = await res.json()
    return data.totalDocs ?? 0
  } catch {
    return 0
  }
}

async function fetchDocs<T>(url: string): Promise<T[]> {
  try {
    const res = await fetch(url)
    if (!res.ok) return []
    const data = await res.json()
    return data.docs ?? []
  } catch {
    return []
  }
}

export default function CrmDashboardView() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [kpis, setKpis] = useState({ newToday: 0, overdueTasks: 0, activeLeads: 0, leadsThisWeek: 0 })
  const [pipeline, setPipeline] = useState<Record<string, number>>({})
  const [recentLeads, setRecentLeads] = useState<Lead[]>([])
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const now = new Date()
      const todayISO = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
      const nowISO = now.toISOString()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

      const [newToday, overdueCount, activeLeads, leadsThisWeek, leads, tasks] = await Promise.all([
        fetchCount(`/api/leads?where[status][equals]=new&where[createdAt][greater_than]=${todayISO}&limit=0`),
        fetchCount(`/api/lead-tasks?where[status][equals]=open&where[dueAt][less_than]=${nowISO}&limit=0`),
        fetchCount(`/api/leads?where[status][not_in]=leased,lost,archived&limit=0`),
        fetchCount(`/api/leads?where[createdAt][greater_than]=${weekAgo}&limit=0`),
        fetchDocs<Lead>(`/api/leads?sort=-createdAt&limit=5&depth=1`),
        fetchDocs<Task>(
          `/api/lead-tasks?where[status][equals]=open&where[dueAt][less_than]=${nowISO}&sort=dueAt&limit=5&depth=1`,
        ),
      ])

      setKpis({ newToday, overdueTasks: overdueCount, activeLeads, leadsThisWeek })
      setRecentLeads(leads)
      setOverdueTasks(tasks)

      // Pipeline counts
      const pipelineCounts: Record<string, number> = {}
      const pipelineResults = await Promise.all(
        PIPELINE_STATUSES.map((s) => fetchCount(`/api/leads?where[status][equals]=${s}&limit=0`)),
      )
      PIPELINE_STATUSES.forEach((s, i) => {
        pipelineCounts[s] = pipelineResults[i]
      })
      setPipeline(pipelineCounts)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const totalPipeline = Object.values(pipeline).reduce((a, b) => a + b, 0)

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
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: GRAY_900, margin: 0 }}>CRM Dashboard</h1>
        <div style={{ display: 'flex', gap: '12px' }}>
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
            Inbox / Follow-ups
          </a>
          <a
            href="/admin/crm/reporting"
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
            Reporting
          </a>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY_500, fontSize: '14px' }}>
          Loading dashboard...
        </div>
      )}

      {!loading && (
        <>
          {/* KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
            {[
              { label: 'New Leads Today', value: kpis.newToday, color: '#3b82f6' },
              { label: 'Overdue Tasks', value: kpis.overdueTasks, color: kpis.overdueTasks > 0 ? '#ef4444' : GRAY_500 },
              { label: 'Active Leads', value: kpis.activeLeads, color: ACCENT },
              { label: 'Leads This Week', value: kpis.leadsThisWeek, color: '#8b5cf6' },
            ].map((kpi) => (
              <div
                key={kpi.label}
                style={{
                  background: '#fff',
                  border: `1px solid ${BORDER}`,
                  borderRadius: '8px',
                  padding: '20px',
                }}
              >
                <div style={{ fontSize: '12px', fontWeight: 500, color: GRAY_500, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {kpi.label}
                </div>
                <div style={{ fontSize: '32px', fontWeight: 700, color: kpi.color }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Pipeline Overview */}
          <div
            style={{
              background: '#fff',
              border: `1px solid ${BORDER}`,
              borderRadius: '8px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <h2 style={{ fontSize: '16px', fontWeight: 600, color: GRAY_900, margin: '0 0 16px 0' }}>
              Pipeline Overview
            </h2>
            {totalPipeline > 0 ? (
              <>
                <div
                  style={{
                    display: 'flex',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    height: '32px',
                    marginBottom: '12px',
                  }}
                >
                  {PIPELINE_STATUSES.map((status, i) => {
                    const count = pipeline[status] || 0
                    if (count === 0) return null
                    const pct = (count / totalPipeline) * 100
                    const hues = [210, 45, 145, 270, 230, 330, 155]
                    return (
                      <div
                        key={status}
                        title={`${STATUS_LABELS[status]}: ${count}`}
                        style={{
                          width: `${pct}%`,
                          backgroundColor: `hsl(${hues[i]}, 60%, 55%)`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                          minWidth: count > 0 ? '24px' : '0',
                        }}
                      >
                        {pct > 8 ? count : ''}
                      </div>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                  {PIPELINE_STATUSES.map((status, i) => {
                    const count = pipeline[status] || 0
                    const hues = [210, 45, 145, 270, 230, 330, 155]
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}>
                        <span
                          style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '2px',
                            backgroundColor: `hsl(${hues[i]}, 60%, 55%)`,
                            display: 'inline-block',
                          }}
                        />
                        <span style={{ color: GRAY_500 }}>{STATUS_LABELS[status]}</span>
                        <span style={{ fontWeight: 600, color: GRAY_900 }}>{count}</span>
                      </div>
                    )
                  })}
                </div>
              </>
            ) : (
              <div style={{ color: GRAY_500, fontSize: '13px' }}>No leads in pipeline</div>
            )}
          </div>

          {/* Two-column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Recent Leads */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: GRAY_900, margin: '0 0 16px 0' }}>
                Recent Leads
              </h2>
              {recentLeads.length === 0 ? (
                <div style={{ color: GRAY_500, fontSize: '13px' }}>No leads yet</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr>
                      {['Name', 'Status', 'Source', 'Assigned', 'Created'].map((h) => (
                        <th
                          key={h}
                          style={{
                            textAlign: 'left',
                            padding: '8px 6px',
                            borderBottom: `1px solid ${BORDER}`,
                            fontSize: '11px',
                            fontWeight: 600,
                            color: GRAY_500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentLeads.map((lead) => (
                      <tr key={lead.id}>
                        <td style={{ padding: '8px 6px', borderBottom: `1px solid ${GRAY_50}` }}>
                          <a
                            href={`/admin/collections/leads/${lead.id}`}
                            style={{ color: ACCENT, textDecoration: 'none', fontWeight: 500 }}
                          >
                            {lead.firstName} {lead.lastName}
                          </a>
                        </td>
                        <td style={{ padding: '8px 6px', borderBottom: `1px solid ${GRAY_50}` }}>
                          {getStatusBadge(lead.status)}
                        </td>
                        <td style={{ padding: '8px 6px', borderBottom: `1px solid ${GRAY_50}`, color: GRAY_500 }}>
                          {lead.source || '--'}
                        </td>
                        <td style={{ padding: '8px 6px', borderBottom: `1px solid ${GRAY_50}`, color: GRAY_500 }}>
                          {getUserName(lead.assignedTo as { email?: string } | string | undefined)}
                        </td>
                        <td style={{ padding: '8px 6px', borderBottom: `1px solid ${GRAY_50}`, color: GRAY_500 }}>
                          {timeAgo(lead.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Overdue Tasks */}
            <div
              style={{
                background: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '8px',
                padding: '20px',
              }}
            >
              <h2 style={{ fontSize: '16px', fontWeight: 600, color: GRAY_900, margin: '0 0 16px 0' }}>
                Overdue Tasks
              </h2>
              {overdueTasks.length === 0 ? (
                <div style={{ color: GRAY_500, fontSize: '13px' }}>No overdue tasks</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {overdueTasks.map((task) => {
                    const lead = typeof task.lead === 'object' ? task.lead : null
                    return (
                      <div
                        key={task.id}
                        style={{
                          padding: '12px',
                          background: '#fef2f2',
                          borderRadius: '6px',
                          border: '1px solid #fecaca',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '13px', color: GRAY_900, marginBottom: '4px' }}>
                          {task.title}
                        </div>
                        <div style={{ fontSize: '12px', color: GRAY_500, display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                          {lead && (
                            <span>
                              Lead:{' '}
                              <a
                                href={`/admin/collections/leads/${lead.id}`}
                                style={{ color: ACCENT, textDecoration: 'none' }}
                              >
                                {lead.firstName} {lead.lastName}
                              </a>
                            </span>
                          )}
                          <span>Due: {formatDate(task.dueAt)}</span>
                          <span>Assigned: {getUserName(task.assignedTo as { email?: string } | string | undefined)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
