import { getPayload } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'

export const runtime = 'nodejs'

const STATUSES = ['draft', 'open', 'closed'] as const

/** PATCH { status } — publish or unpublish a job. Editing the posting itself stays in the website admin. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const id = Number((await params).id)
  let status: unknown
  try {
    status = (await request.json()).status
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (!Number.isSafeInteger(id) || !STATUSES.includes(status as never))
    return Response.json({ error: 'Choose draft, open or closed.' }, { status: 400 })
  const payload = await getPayload({ config })
  try {
    // Jobs' afterChange hooks revalidate the public careers pages.
    const job = await payload.update({
      collection: 'jobs',
      id,
      data: { status: status as (typeof STATUSES)[number] },
      depth: 0,
    })
    console.info('[os-hiring] job', id, 'set to', status, 'by', auth.caller.actor)
    return Response.json({ id: job.id, status: job.status })
  } catch {
    return Response.json({ error: 'Job not found' }, { status: 404 })
  }
}
