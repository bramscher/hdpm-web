import { getPayload } from 'payload'
import config from '@payload-config'
import { validateApplication } from '@/lib/career-validation'
import {
  careerStorage,
  limitCareerRequests,
  readAttachment,
  sameOrigin,
  type Attachment,
} from '@/lib/career-storage'
import { SITE_URL } from '@/lib/site-url'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return Response.json(
      { error: 'Please use the application form on this site.' },
      { status: 403 },
    )
  if (Number(request.headers.get('content-length')) > 24000)
    return Response.json({ error: 'Application too large.' }, { status: 413 })
  try {
    const body = await request.json()
    if (body.website)
      return Response.json(
        { error: 'Unable to submit this application.' },
        { status: 400 },
      )
    let form
    try {
      form = validateApplication(body)
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 })
    }
    const payload = await getPayload({ config })
    if (!(await limitCareerRequests(payload, request, 'apply', 10)))
      return Response.json(
        { error: 'Too many attempts. Please try again in an hour.' },
        { status: 429 },
      )
    const existing = await payload.find({
      collection: 'job-applications',
      where: { submissionId: { equals: form.submissionId } },
      limit: 1,
      depth: 0,
    })
    if (existing.docs.length) return Response.json({ ok: true })
    const { docs } = await payload.find({
      collection: 'jobs',
      where: {
        and: [{ id: { equals: form.jobId } }, { status: { equals: 'open' } }],
      },
      limit: 1,
      depth: 0,
    })
    if (!docs.length)
      return Response.json(
        {
          error: 'This position is no longer open. Please choose another role.',
        },
        { status: 400 },
      )
    const attachments: Attachment[] = []
    try {
      if (
        body.attachments !== undefined &&
        (!Array.isArray(body.attachments) || body.attachments.length > 2)
      )
        throw new Error('Please attach at most one résumé and one video.')
      for (const token of body.attachments || []) {
        if (typeof token !== 'string' || token.length > 3000)
          throw new Error('Invalid upload receipt.')
        const file = readAttachment(token, form.submissionId)
        if (attachments.some((a) => a.kind === file.kind))
          throw new Error('Please attach only one file of each type.')
        const { data, error } = await careerStorage().info(file.path)
        if (
          error ||
          !data ||
          Number(data.size) !== file.size ||
          data.contentType !== file.mime
        )
          throw new Error(
            'An upload is incomplete or does not match the selected file. Please select it again.',
          )
        attachments.push(file)
      }
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 })
    }
    const { jobId, ...fields } = form
    await payload.create({
      collection: 'job-applications',
      data: {
        ...fields,
        job: jobId,
        jobTitle: docs[0].title,
        attachments: JSON.parse(JSON.stringify(attachments)),
        resumeDownload: attachments.some((f) => f.kind === 'resume')
          ? `${SITE_URL}/api/careers/files/${form.submissionId}?kind=resume`
          : undefined,
        videoDownload: attachments.some((f) => f.kind === 'video')
          ? `${SITE_URL}/api/careers/files/${form.submissionId}?kind=video`
          : undefined,
        notificationStatus: 'pending',
      },
    })
    return Response.json({ ok: true })
  } catch (error) {
    console.error(
      '[careers] Application submission failed',
      error instanceof Error ? error.message : 'Unknown error',
    )
    return Response.json(
      {
        error:
          'We could not confirm your application was saved. Please try again. Your form is still here, or contact work@highdesertpm.com for help.',
      },
      { status: 503 },
    )
  }
}
