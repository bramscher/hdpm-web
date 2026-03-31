'use client'

import React, { useState, useEffect, useCallback } from 'react'

interface Lead {
  id: string
  firstName?: string
  lastName?: string
  email?: string
}

interface Task {
  id: string
  title?: string
  lead?: Lead | string
  dueAt?: string
  assignedTo?: { email?: string; id?: string } | string
  status?: string
  taskType?: string
  priority?: string
}

const ACCENT = '#2ECC52'
const BORDER = '#e5e7eb'
const GRAY_50 = '#f9fafb'
const GRAY_500 = '#6b7280'
const GRAY_900 = '#111827'

const PRIORITY_COLORS: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#fef2f2', text: '#dc2626' },
  high: { bg: '#fff7ed', text: '#ea580c' },
  medium: { bg: '#fefce8', text: '#ca8a04' },
  low: { bg: '#f0fdf4', text: '#16a34a' },
}

const TASK_TYPE_LABELS: Record<string, string> = {
  follow_up_call: 'Call',
  follow_up_sms: 'SMS',
  follow_up_email: 'Email',
  manual_review: 'Review',
  spanish_follow_up: 'Spanish',
  appfolio_push: 'AppFolio',
  other: 'Other',
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '--'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function getOverdueText(dateStr?: string): { text: string; isOverdue: boolean } {
  if (!dateStr) return { text: '--', isOverdue: false }
  const now = new Date()
  const due = new Date(dateStr)
  const diffMs = now.getTime() - due.getTime()
  if (diffMs <= 0) {
    const aheadMin = Math.floor(-diffMs / 60000)
    if (aheadMin < 60) return { text: `in ${aheadMin}m`, isOverdue: false }
    const aheadHr = Math.floor(aheadMin / 60)
    if (aheadHr < 24) return { text: `in ${aheadHr}h`, isOverdue: false }
    return { text: formatDate(dateStr), isOverdue: false }
  }
  const overdueMin = Math.floor(diffMs / 60000)
  if (overdueMin < 60) return { text: `${overdueMin}m overdue`, isOverdue: true }
  const overdueHr = Math.floor(overdueMin / 60)
  if (overdueHr < 24) return { text: `${overdueHr}h overdue`, isOverdue: true }
  const overdueDays = Math.floor(overdueHr / 24)
  return { text: `${overdueDays}d overdue`, isOverdue: true }
}

function getUserName(user: { email?: string; id?: string } | string | undefined): string {
  if (!user) return '--'
  if (typeof user === 'string') return user
  return user.email || '--'
}

export default function InboxView() {
  const [activeTab, setActiveTab] = useState<'due' | 'upcoming'>('due')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dueTasks, setDueTasks] = useState<Task[]>([])
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([])
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const nowISO = new Date().toISOString()
      const [dueRes, upcomingRes] = await Promise.all([
        fetch(
          `/api/lead-tasks?where[status][in]=open,in_progress&where[dueAt][less_than_equal]=${nowISO}&sort=dueAt&limit=25&depth=1`,
        ),
        fetch(
          `/api/lead-tasks?where[status][equals]=open&where[dueAt][greater_than]=${nowISO}&sort=dueAt&limit=25&depth=1`,
        ),
      ])
      if (!dueRes.ok || !upcomingRes.ok) throw new Error('Failed to fetch tasks')
      const dueData = await dueRes.json()
      const upcomingData = await upcomingRes.json()
      setDueTasks(dueData.docs ?? [])
      setUpcomingTasks(upcomingData.docs ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  async function markComplete(taskId: string) {
    setActionLoading(taskId)
    try {
      const res = await fetch(`/api/lead-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'complete', completedAt: new Date().toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to update task')
      await loadData()
    } catch {
      // silently fail, user can retry
    } finally {
      setActionLoading(null)
    }
  }

  async function reschedule(taskId: string, currentDueAt?: string) {
    setActionLoading(taskId)
    try {
      const current = currentDueAt ? new Date(currentDueAt) : new Date()
      const newDue = new Date(current.getTime() + 24 * 60 * 60 * 1000)
      const res = await fetch(`/api/lead-tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dueAt: newDue.toISOString() }),
      })
      if (!res.ok) throw new Error('Failed to reschedule task')
      await loadData()
    } catch {
      // silently fail
    } finally {
      setActionLoading(null)
    }
  }

  function renderTaskRow(task: Task, showOverdue: boolean) {
    const lead = typeof task.lead === 'object' ? task.lead : null
    const overdue = getOverdueText(task.dueAt)
    const priorityColor = PRIORITY_COLORS[task.priority || 'medium'] || PRIORITY_COLORS.medium
    const isActioning = actionLoading === task.id

    return (
      <tr key={task.id} style={{ opacity: isActioning ? 0.5 : 1 }}>
        <td style={{ padding: '10px 8px', borderBottom: `1px solid ${GRAY_50}`, fontWeight: 500, color: GRAY_900, fontSize: '13px' }}>
          {task.title || '--'}
        </td>
        <td style={{ padding: '10px 8px', borderBottom: `1px solid ${GRAY_50}`, fontSize: '13px' }}>
          {lead ? (
            <a
              href={`/admin/collections/leads/${lead.id}`}
              style={{ color: ACCENT, textDecoration: 'none', fontWeight: 500 }}
            >
              {lead.firstName} {lead.lastName}
            </a>
          ) : (
            <span style={{ color: GRAY_500 }}>--</span>
          )}
        </td>
        <td style={{ padding: '10px 8px', borderBottom: `1px solid ${GRAY_50}`, fontSize: '13px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ color: GRAY_500 }}>{formatDate(task.dueAt)} {formatTime(task.dueAt)}</span>
            {showOverdue && overdue.isOverdue && (
              <span style={{ color: '#dc2626', fontSize: '11px', fontWeight: 600 }}>{overdue.text}</span>
            )}
            {!showOverdue && !overdue.isOverdue && (
              <span style={{ color: ACCENT, fontSize: '11px', fontWeight: 500 }}>{overdue.text}</span>
            )}
          </div>
        </td>
        <td style={{ padding: '10px 8px', borderBottom: `1px solid ${GRAY_50}`, fontSize: '12px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: '#f3f4f6',
              color: GRAY_500,
              fontWeight: 500,
            }}
          >
            {TASK_TYPE_LABELS[task.taskType || ''] || task.taskType || '--'}
          </span>
        </td>
        <td style={{ padding: '10px 8px', borderBottom: `1px solid ${GRAY_50}`, fontSize: '12px', color: GRAY_500 }}>
          {getUserName(task.assignedTo as { email?: string } | string | undefined)}
        </td>
        <td style={{ padding: '10px 8px', borderBottom: `1px solid ${GRAY_50}`, fontSize: '12px' }}>
          <span
            style={{
              display: 'inline-block',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: priorityColor.bg,
              color: priorityColor.text,
              fontWeight: 600,
              fontSize: '11px',
              textTransform: 'capitalize',
            }}
          >
            {task.priority || 'medium'}
          </span>
        </td>
        <td style={{ padding: '10px 8px', borderBottom: `1px solid ${GRAY_50}` }}>
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => markComplete(task.id)}
              disabled={isActioning}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: '#fff',
                backgroundColor: ACCENT,
                border: 'none',
                borderRadius: '4px',
                cursor: isActioning ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Complete
            </button>
            <button
              onClick={() => reschedule(task.id, task.dueAt)}
              disabled={isActioning}
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 600,
                color: GRAY_900,
                backgroundColor: '#fff',
                border: `1px solid ${BORDER}`,
                borderRadius: '4px',
                cursor: isActioning ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              +1 Day
            </button>
          </div>
        </td>
      </tr>
    )
  }

  const currentTasks = activeTab === 'due' ? dueTasks : upcomingTasks

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
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: GRAY_900, margin: 0 }}>Inbox / Follow-ups</h1>
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

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '20px', borderBottom: `2px solid ${BORDER}` }}>
        {[
          { key: 'due' as const, label: 'Due Now / Overdue', count: dueTasks.length },
          { key: 'upcoming' as const, label: 'Upcoming', count: upcomingTasks.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 600,
              color: activeTab === tab.key ? ACCENT : GRAY_500,
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === tab.key ? `2px solid ${ACCENT}` : '2px solid transparent',
              marginBottom: '-2px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {tab.label}
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '20px',
                height: '20px',
                padding: '0 6px',
                borderRadius: '10px',
                fontSize: '11px',
                fontWeight: 700,
                backgroundColor: activeTab === tab.key ? ACCENT : '#e5e7eb',
                color: activeTab === tab.key ? '#fff' : GRAY_500,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: GRAY_500, fontSize: '14px' }}>
          Loading tasks...
        </div>
      )}

      {!loading && (
        <div
          style={{
            background: '#fff',
            border: `1px solid ${BORDER}`,
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          {currentTasks.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: GRAY_500, fontSize: '14px' }}>
              {activeTab === 'due' ? 'No overdue or due tasks -- you\'re all caught up!' : 'No upcoming tasks scheduled'}
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr>
                  {['Task', 'Lead', 'Due', 'Type', 'Assigned', 'Priority', 'Actions'].map((h) => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 8px',
                        borderBottom: `1px solid ${BORDER}`,
                        fontSize: '11px',
                        fontWeight: 600,
                        color: GRAY_500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        backgroundColor: GRAY_50,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {currentTasks.map((task) => renderTaskRow(task, activeTab === 'due'))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
