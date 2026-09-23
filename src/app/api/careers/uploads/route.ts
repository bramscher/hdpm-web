import { randomUUID } from 'node:crypto'
import { getPayload } from 'payload'
import config from '@payload-config'
import { validateUpload } from '@/lib/career-validation'
import {
  careerStorage,
  limitCareerRequests,
  sameOrigin,
  signAttachment,
} from '@/lib/career-storage'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: 'Please use the application form on this site.' },
      { status: 403 },
    )
  if (Number(request.headers.get('content-length')) > 8192)
    return Response.json({ error: 'Request too large.' }, { status: 413 })
  try {
    const body = await request.json()
    if (body.website || !/^[0-9a-f-]{36}$/i.test(body.submissionId || ''))
      return Response.json({ error: 'Invalid request.' }, { status: 400 })
    let file
    try {
      file = validateUpload(body.kind, body.name, body.size)
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 })
    }
    const payload = await getPayload({ config })
    if (!(await limitCareerRequests(payload, request, 'upload', 20)))
      return Response.json(
        { error: 'Too many uploads. Please try again in an hour.' },
        { status: 429 },
      )
    const jobs = await payload.find({
      collection: 'jobs',
      where: {
        and: [
          { id: { equals: Number(body.jobId) } },
          { status: { equals: 'open' } },
        ],
      },
      limit: 1,
      depth: 0,
    })
    if (!jobs.docs.length)
      return Response.json(
        { error: 'Please choose an open position.' },
        { status: 400 },
      )
    const path = `${body.submissionId}/${randomUUID()}.${file.extension}`
    const { data, error } = await careerStorage().createSignedUploadUrl(path, {
      upsert: false,
    })
    if (error || !data) throw new Error('Could not prepare upload')
    const receipt = signAttachment({
      ...file,
      path,
      submissionId: body.submissionId,
      expires: Date.now() + 2 * 3600000,
    })
    return Response.json({ url: data.signedUrl, receipt, mime: file.mime })
  } catch {
    return Response.json(
      {
        error:
          'Uploads are temporarily unavailable. Please try again or contact work@highdesertpm.com.',
      },
      { status: 503 },
    )
  }
}
