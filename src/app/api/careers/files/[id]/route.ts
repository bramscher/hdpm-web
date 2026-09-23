import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAuth } from '@/lib/api-auth'
import { careerStorage, type Attachment } from '@/lib/career-storage'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth({ roles: ['admin'] })
  if (!auth.ok)
    return Response.json(
      {
        error:
          'Sign in to the site admin with an administrator account, then reopen this link.',
      },
      { status: auth.status },
    )
  const { id } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'job-applications',
    where: { submissionId: { equals: id } },
    limit: 1,
    depth: 0,
  })
  const attachments = docs[0]?.attachments as Attachment[] | undefined
  const file = attachments?.find(
    (f) => f.kind === new URL(request.url).searchParams.get('kind'),
  )
  if (!file) return Response.json({ error: 'File not found.' }, { status: 404 })
  const { data, error } = await careerStorage().createSignedUrl(file.path, 60, {
    download: file.name,
  })
  if (error || !data)
    return Response.json(
      { error: 'Download unavailable. Please try again.' },
      { status: 503 },
    )
  return new Response(null, {
    status: 302,
    headers: {
      Location: data.signedUrl,
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    },
  })
}
