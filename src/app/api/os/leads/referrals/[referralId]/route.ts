import { getPayload } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'
import { boardLead, websiteUserFor } from '@/lib/os-leads'
import { parseReferral, upsertReferralLead } from '@/lib/os-referrals'

export const runtime = 'nodejs'

/**
 * PUT /api/os/leads/referrals/{referralId}
 * HDPM OS sends a partner-portal referral; the website creates, finds or links
 * the owner lead (see upsertReferralLead). Safe to resend.
 * 200 { outcome, created, leadId, lead } · 400/422 { error, code? } · 401
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ referralId: string }> },
) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  const parsed = parseReferral((await params).referralId, body)
  if (!parsed.ok)
    return Response.json(
      { error: parsed.error, ...(parsed.code ? { code: parsed.code } : {}) },
      { status: parsed.status },
    )

  const payload = await getPayload({ config })
  try {
    const user = await websiteUserFor(payload, auth.caller.actor)
    const { outcome, lead } = await upsertReferralLead(payload, parsed.value, user)
    console.info('[os-referrals]', parsed.value.referralId, outcome, 'lead', lead.id, 'by', auth.caller.actor)
    return Response.json({ outcome, created: outcome === 'created', leadId: lead.id, lead: boardLead(lead) })
  } catch (error) {
    console.error('[os-referrals] failed', parsed.value.referralId, error instanceof Error ? error.message : error)
    return Response.json({ error: 'Could not save the referral. Try again.' }, { status: 500 })
  }
}
