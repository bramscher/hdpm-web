import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

const SERVICE_TOKEN = process.env.HDPM_SERVICE_TOKEN || ''

type Status = 'requested' | 'in_review' | 'delivered' | 'declined'

interface StatusUpdateBody {
  lead_id: number
  rent_analysis_id?: string
  status: Status
  short_url?: string
}

/**
 * POST /api/crm/rental-analysis/status
 *
 * Service-to-service callback from hdpm-chatbot. Updates the Lead's
 * rentAnalysisStatus, rentAnalysisId, and rentAnalysisShortUrl so the
 * operations team can see analysis progress directly in the CRM.
 *
 * Auth: Bearer HDPM_SERVICE_TOKEN.
 */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (!SERVICE_TOKEN || auth !== `Bearer ${SERVICE_TOKEN}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: StatusUpdateBody
  try {
    body = (await req.json()) as StatusUpdateBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.lead_id || !body.status) {
    return NextResponse.json(
      { error: 'lead_id and status are required' },
      { status: 400 },
    )
  }

  const validStatuses: Status[] = ['requested', 'in_review', 'delivered', 'declined']
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  try {
    const payload: AnyPayload = await getPayload({ config })
    await payload.update({
      collection: 'leads',
      id: body.lead_id,
      data: {
        rentAnalysisStatus: body.status,
        ...(body.rent_analysis_id ? { rentAnalysisId: body.rent_analysis_id } : {}),
        ...(body.short_url ? { rentAnalysisShortUrl: body.short_url } : {}),
      },
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[rental-analysis/status] update failed:', err)
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 },
    )
  }
}
