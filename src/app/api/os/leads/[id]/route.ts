import { getPayload } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'
import {
  allowedNextStatuses,
  assignableUsers,
  leadSummary,
  userSummary,
  websiteUserFor,
} from '@/lib/os-leads'
import type { User } from '@/payload-types'

export const runtime = 'nodejs'

function leadId(raw: string) {
  const id = Number(raw)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

/** GET — full lead, its activity history and the statuses it can move to. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const id = leadId((await params).id)
  const payload = await getPayload({ config })
  const lead = id
    ? await payload.findByID({ collection: 'leads', id, depth: 1 }).catch(() => null)
    : null
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })
  const [activities, users] = await Promise.all([
    payload.find({
      collection: 'lead-activities',
      where: { lead: { equals: lead.id } },
      sort: '-createdAt',
      limit: 100,
      depth: 1,
      pagination: false,
    }),
    assignableUsers(payload),
  ])
  return Response.json({
    lead: {
      ...leadSummary(lead),
      preferredLanguage: lead.preferredLanguage ?? null,
      doNotContact: Boolean(lead.doNotContact),
      sourceDetail: lead.sourceDetail ?? null,
      stageReason: lead.stageReason ?? null,
      notesSummary: lead.notesSummary ?? null,
      message: lead.message ?? null,
      desiredMoveInDate: lead.desiredMoveInDate ?? null,
      monthlyBudgetMin: lead.monthlyBudgetMin ?? null,
      monthlyBudgetMax: lead.monthlyBudgetMax ?? null,
      subjectProperty: lead.subjectProperty ?? null,
      rentAnalysisStatus: lead.rentAnalysisStatus ?? null,
      rentAnalysisShortUrl: lead.rentAnalysisShortUrl ?? null,
      lastContactedAt: lead.lastContactedAt ?? null,
      attribution: lead.attribution ?? null,
      allowedStatuses: allowedNextStatuses(lead.status),
    },
    activities: activities.docs.map((a) => ({
      id: a.id,
      type: a.type,
      direction: a.direction ?? null,
      body: a.body,
      performedBy:
        userSummary(a.performedBy as User | number | null)?.name ??
        ((a.metadata as { actor?: string } | null)?.actor || null),
      createdAt: a.createdAt,
    })),
    users,
  })
}

/** PATCH { status?, nextFollowUpAt? (ISO or null), assignedTo? (user id or null) } */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const id = leadId((await params).id)
  if (!id) return Response.json({ error: 'Lead not found' }, { status: 404 })
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (typeof body.status === 'string') data.status = body.status
  if ('nextFollowUpAt' in body) {
    if (body.nextFollowUpAt === null) data.nextFollowUpAt = null
    else {
      const date = new Date(String(body.nextFollowUpAt))
      if (Number.isNaN(date.getTime()))
        return Response.json({ error: 'Pick a valid follow-up date.' }, { status: 400 })
      data.nextFollowUpAt = date.toISOString()
    }
  }
  if ('assignedTo' in body) {
    const userId = body.assignedTo === null ? null : Number(body.assignedTo)
    if (userId !== null && !Number.isSafeInteger(userId))
      return Response.json({ error: 'Choose someone to assign.' }, { status: 400 })
    data.assignedTo = userId
  }
  if (!Object.keys(data).length)
    return Response.json({ error: 'Nothing to update' }, { status: 400 })

  const payload = await getPayload({ config })
  const existing = await payload
    .findByID({ collection: 'leads', id, depth: 0 })
    .catch(() => null)
  if (!existing) return Response.json({ error: 'Lead not found' }, { status: 404 })
  try {
    // Acting as the matching website user records them on the status-change history.
    const user = await websiteUserFor(payload, auth.caller.actor)
    const lead = await payload.update({
      collection: 'leads',
      id,
      data,
      depth: 1,
      ...(user ? { user } : {}),
    })
    console.info('[os-leads] lead', id, 'updated by', auth.caller.actor, Object.keys(data))
    return Response.json({ lead: { ...leadSummary(lead), allowedStatuses: allowedNextStatuses(lead.status) } })
  } catch (error) {
    // Invalid pipeline moves throw a readable message from the leads hook.
    const message = error instanceof Error ? error.message : 'Could not update lead'
    return Response.json({ error: message }, { status: 400 })
  }
}
