import { getPayload } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'
import { careerStorage, type Attachment } from '@/lib/career-storage'

export const runtime = 'nodejs'
export const maxDuration = 60

async function findApplication(id: string) {
  const numeric = Number(id)
  if (!Number.isSafeInteger(numeric) || numeric < 1) return null
  const payload = await getPayload({ config })
  const doc = await payload
    .findByID({ collection: 'job-applications', id: numeric, depth: 0 })
    .catch(() => null)
  return doc ? { payload, doc } : null
}

/** GET ?kind=resume|video — a 10-minute private link to view that file. */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const kind = new URL(request.url).searchParams.get('kind')
  const found = await findApplication((await params).id)
  const file = (found?.doc.attachments as Attachment[] | null)?.find(
    (f) => f.kind === kind,
  )
  if (!found || !file)
    return Response.json({ error: 'File not found' }, { status: 404 })
  const { data, error } = await careerStorage().createSignedUrl(file.path, 600)
  if (error || !data)
    return Response.json({ error: 'File is temporarily unavailable' }, { status: 503 })
  console.info('[os-hiring] file opened by', auth.caller.actor, found.doc.id, kind)
  return Response.json({ url: data.signedUrl, name: file.name, mime: file.mime })
}

/** POST — email this application again (with attachments) to the current recipients. */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const found = await findApplication((await params).id)
  if (!found) return Response.json({ error: 'Application not found' }, { status: 404 })
  const updated = await found.payload.update({
    collection: 'job-applications',
    id: found.doc.id,
    data: { notificationStatus: 'pending' },
    depth: 0,
  })
  console.info('[os-hiring] application resent by', auth.caller.actor, found.doc.id)
  return Response.json({ notificationStatus: updated.notificationStatus })
}
