'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '@payloadcms/ui'
import { useRouter } from 'next/navigation'

type Status = 'open' | 'closed' | 'draft'

export default function JobAvailabilityCell({ cellData, rowData }: {
  cellData?: Status
  rowData: { id: number | string; title?: string }
}) {
  const { user } = useAuth()
  const router = useRouter()
  const [status, setStatus] = useState<Status>(cellData || 'draft')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inFlight = useRef(false)
  const canEdit = ['admin', 'editor', 'api'].includes(String(user?.role))
  useEffect(() => { setStatus(cellData || 'draft') }, [cellData, rowData.id])

  async function toggle() {
    if (!canEdit || inFlight.current) return
    inFlight.current = true
    setSaving(true)
    setError('')
    const next = status === 'open' ? 'closed' : 'open'
    try {
      const response = await fetch(`/api/jobs/${encodeURIComponent(String(rowData.id))}`, {
        method: 'PATCH',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      })
      const data = await response.json()
      if (!response.ok || data.doc?.status !== next) {
        throw new Error(data.errors?.[0]?.message || data.message || 'Could not save availability. Try again.')
      }
      setStatus(next)
      // Refresh the current query so status filters, counts and sorting stay correct.
      try { router.refresh() } catch {
        setError('Availability saved. Refresh the list to update its filters.')
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Could not save availability. Try again.')
    } finally {
      inFlight.current = false
      setSaving(false)
    }
  }

  const open = status === 'open'
  return (
    <div style={{ minWidth: 150 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', whiteSpace: 'nowrap' }}>
        <button
          type="button"
          role="switch"
          aria-checked={open}
          aria-label={`Accept applications for ${rowData.title || 'this job'}`}
          aria-busy={saving}
          disabled={!canEdit || saving}
          title={canEdit ? 'Click to save availability immediately' : 'You do not have permission to change availability'}
          onClick={(event) => { event.stopPropagation(); void toggle() }}
          style={{
            display: 'inline-flex', alignItems: 'center', flexShrink: 0,
            width: 42, height: 24, padding: 3, border: '1px solid var(--theme-elevation-400, #888)',
            borderRadius: 14, background: open ? '#2c6b37' : 'var(--theme-elevation-300, #999)',
            cursor: !canEdit || saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1,
          }}
        >
          <span aria-hidden="true" style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', transform: open ? 'translateX(17px)' : 'translateX(0)', transition: 'transform 0.15s' }} />
        </button>
        <span aria-live="polite" style={{ fontSize: 12 }}>
          {saving ? 'Saving…' : open ? 'On · Published' : status === 'draft' ? 'Off · Draft' : 'Off · Closed'}
        </span>
      </div>
      {error && <p role="alert" style={{ maxWidth: 260, margin: '6px 0 0', fontSize: 12, color: 'var(--theme-error-500, #c33)' }}>{error}</p>}
    </div>
  )
}
