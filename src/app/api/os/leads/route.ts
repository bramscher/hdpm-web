import { getPayload, type Where } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'
import {
  BOARD_LIMIT,
  BOARD_STATUSES,
  CLOSED_STATUSES,
  assignableUsers,
  boardLead,
  leadSummary,
} from '@/lib/os-leads'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

/**
 * GET ?view=open|all|<status>&type=tenant|owner|vendor|other&q=search&page=N
 * Lead list for the HDPM OS Leads page. "open" (default) hides leased, lost
 * and archived leads.
 *
 * GET ?view=board&type=owner
 * Every owner lead in a growth-board stage (new through signed, plus lost), not
 * paged, capped at BOARD_LIMIT. Each lead carries the card fields from boardLead.
 */
export async function GET(request: Request) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const params = new URL(request.url).searchParams
  const view = params.get('view') || 'open'
  const type = params.get('type')
  const q = (params.get('q') || '').trim().slice(0, 100)
  const page = Math.max(1, Math.min(1000, Number(params.get('page')) || 1))

  if (view === 'board') return boardResponse(type)

  const and: Where[] = []
  if (view === 'open') and.push({ status: { not_in: [...CLOSED_STATUSES] } })
  else if (view !== 'all') and.push({ status: { equals: view } })
  if (type) and.push({ leadType: { equals: type } })
  if (q)
    and.push({
      or: [
        { firstName: { like: q } },
        { lastName: { like: q } },
        { email: { like: q } },
        { phone: { like: q.replace(/\D/g, '') || q } },
      ],
    })

  const payload = await getPayload({ config })
  const [leads, users] = await Promise.all([
    payload.find({
      collection: 'leads',
      where: and.length ? { and } : undefined,
      sort: '-createdAt',
      limit: PAGE_SIZE,
      page,
      depth: 1,
    }),
    assignableUsers(payload),
  ])
  return Response.json({
    leads: leads.docs.map(leadSummary),
    page: leads.page,
    totalPages: leads.totalPages,
    totalDocs: leads.totalDocs,
    users,
  })
}

async function boardResponse(type: string | null) {
  if (type !== 'owner')
    return Response.json({ error: 'The board view is for owner leads (type=owner).' }, { status: 400 })
  const payload = await getPayload({ config })
  const [leads, users] = await Promise.all([
    payload.find({
      collection: 'leads',
      where: {
        and: [{ leadType: { equals: 'owner' } }, { status: { in: [...BOARD_STATUSES] } }],
      },
      sort: '-createdAt',
      limit: BOARD_LIMIT,
      depth: 1,
    }),
    assignableUsers(payload),
  ])
  return Response.json({
    leads: leads.docs.map(boardLead),
    users,
    totalDocs: leads.totalDocs,
    truncated: leads.totalDocs > leads.docs.length,
  })
}
