import type { Lead } from '../../payload-types'
import { LeadStatus, nextStatuses } from './types'

/**
 * Tell HDPM OS about a new owner lead so it DMs Craig a Slack card with stage
 * buttons (HDPM OS /api/intake/owner-lead). Best-effort: never throws, and
 * gives up after 5s so a slow OS can't hold up lead creation.
 */
export async function sendOwnerLeadAlert(lead: Lead): Promise<void> {
  const baseUrl = (process.env.HDPM_CHATBOT_BASE_URL || '').trim().replace(/\/+$/, '')
  const token = (process.env.HDPM_SERVICE_TOKEN || '').trim()
  if (!baseUrl || !token) {
    console.warn('[owner-lead-alert] HDPM_CHATBOT_BASE_URL or HDPM_SERVICE_TOKEN not configured')
    return
  }

  const status = (lead.status ?? 'new') as LeadStatus
  const property = [lead.subjectProperty?.address, lead.subjectProperty?.town]
    .filter(Boolean)
    .join(', ')
  try {
    const res = await fetch(`${baseUrl}/api/intake/owner-lead`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: lead.id,
        name: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email || `Lead ${lead.id}`,
        email: lead.email ?? null,
        phone: lead.phone ?? null,
        status,
        source: lead.source ?? null,
        message: lead.message ?? null,
        property: property || null,
        isDuplicateOfLeadId: lead.isDuplicateOfLeadId ?? null,
        allowedStatuses: nextStatuses(status, 'owner'),
      }),
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) {
      console.error('[owner-lead-alert] HDPM OS returned', res.status, (await res.text()).slice(0, 200))
    }
  } catch (err) {
    console.error('[owner-lead-alert] failed:', err instanceof Error ? err.message : err)
  }
}
