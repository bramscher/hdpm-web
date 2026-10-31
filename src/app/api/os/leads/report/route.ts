import { getPayload } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'
import type { Lead, LeadActivity } from '@/payload-types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Owner pipeline stages counted when a lead moves into them during the window. */
const OWNER_STAGES = ['consult_booked', 'proposal_sent', 'signed'] as const

/**
 * GET ?from=ISO&to=ISO
 * Lead numbers for the HDPM OS monthly growth report: leads created in the
 * window (by type and source), owner leads still untouched, and owner leads
 * that reached consult / proposal / signed in the window (from status-change
 * activity, so a lead created earlier still counts the month it signs).
 */
export async function GET(request: Request) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const params = new URL(request.url).searchParams
  const from = params.get('from')
  const to = params.get('to')
  if (!from || !to || Number.isNaN(Date.parse(from)) || Number.isNaN(Date.parse(to))) {
    return Response.json({ error: 'from and to (ISO dates) are required' }, { status: 400 })
  }

  const payload = await getPayload({ config })
  const window = { greater_than_equal: from, less_than: to }

  const [created, changes] = await Promise.all([
    payload.find({
      collection: 'leads',
      where: { createdAt: window },
      pagination: false,
      depth: 0,
    }),
    payload.find({
      collection: 'lead-activities',
      where: { and: [{ type: { equals: 'status_changed' } }, { createdAt: window }] },
      pagination: false,
      depth: 1,
    }),
  ])

  const leads = created.docs as Lead[]
  const byType: Record<string, number> = {}
  const bySource: Record<string, number> = {}
  for (const l of leads) {
    const type = l.leadType ?? 'untyped'
    byType[type] = (byType[type] ?? 0) + 1
    const source = l.source ?? 'unknown'
    bySource[source] = (bySource[source] ?? 0) + 1
  }

  const owners = leads.filter((l) => l.leadType === 'owner')
  const ownerStillNew = owners.filter((l) => (l.status ?? 'new') === 'new').length
  const ownerUnassigned = owners.filter((l) => !l.assignedTo).length

  // One entry per lead per stage, even if it bounced in and out of a stage.
  const reached: Record<(typeof OWNER_STAGES)[number], Map<number, string>> = {
    consult_booked: new Map(),
    proposal_sent: new Map(),
    signed: new Map(),
  }
  for (const a of changes.docs as LeadActivity[]) {
    const toStatus = (a.metadata as { to?: string } | null)?.to
    const lead = typeof a.lead === 'object' ? (a.lead as Lead) : null
    if (!lead || lead.leadType !== 'owner') continue
    if (!OWNER_STAGES.includes(toStatus as (typeof OWNER_STAGES)[number])) continue
    const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email || `Lead ${lead.id}`
    reached[toStatus as (typeof OWNER_STAGES)[number]].set(lead.id, name)
  }

  return Response.json({
    from,
    to,
    created: { total: leads.length, byType, bySource },
    owner: {
      created: owners.length,
      stillNew: ownerStillNew,
      unassigned: ownerUnassigned,
      consultsBooked: reached.consult_booked.size,
      proposalsSent: reached.proposal_sent.size,
      signed: reached.signed.size,
      signedNames: [...reached.signed.values()],
    },
  })
}
