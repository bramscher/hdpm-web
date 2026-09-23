import { getPayload } from 'payload'
import config from '@payload-config'
import type { Attachment } from './career-storage'

// Call only after checking administrator access. Never expose storage paths
// or applicant data through an unauthenticated endpoint.
export async function findCareerAttachment(id: string, kind: string) {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'job-applications',
    where: { submissionId: { equals: id } },
    limit: 1,
    depth: 0,
  })
  const application = docs[0]
  const file = (application?.attachments as Attachment[] | undefined)?.find(
    (f) => f.kind === kind,
  )
  return application && file ? { application, file } : null
}
