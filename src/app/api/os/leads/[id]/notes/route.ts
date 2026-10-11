import { getPayload } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'
import { websiteUserFor } from '@/lib/os-leads'

export const runtime = 'nodejs'

/** POST { body } — add a note to the lead's activity history. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const id = Number((await params).id)
  let text = ''
  try {
    const body = await request.json()
    text = typeof body.body === 'string' ? body.body.trim() : ''
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!text || text.length > 5000)
    return Response.json({ error: 'Write a note (up to 5,000 characters).' }, { status: 400 })

  const payload = await getPayload({ config })
  const lead = Number.isSafeInteger(id)
    ? await payload.findByID({ collection: 'leads', id, depth: 0 }).catch(() => null)
    : null
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 })
  const user = await websiteUserFor(payload, auth.caller.actor)
  const note = await payload.create({
    collection: 'lead-activities',
    data: {
      lead: lead.id,
      type: 'note',
      direction: 'internal',
      body: text,
      performedBy: user?.id,
      metadata: { via: 'hdpm-os', actor: auth.caller.actor },
    },
    depth: 0,
  })
  console.info('[os-leads] note added to lead', lead.id, 'by', auth.caller.actor)
  return Response.json({ id: note.id })
}
