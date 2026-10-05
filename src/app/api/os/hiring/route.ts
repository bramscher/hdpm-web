import { getPayload } from 'payload'
import config from '@payload-config'
import { requireOsAdmin } from '@/lib/os-service-auth'
import type { Attachment } from '@/lib/career-storage'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET — everything the HDPM OS Hiring page shows: settings, jobs and recent applications. */
export async function GET(request: Request) {
  const auth = requireOsAdmin(request)
  if (!auth.ok) return auth.response
  const payload = await getPayload({ config })
  const [settings, jobs, applications] = await Promise.all([
    payload.findGlobal({ slug: 'hiring-settings', depth: 0 }).catch(() => null),
    payload.find({
      collection: 'jobs',
      sort: 'order',
      limit: 100,
      depth: 0,
      pagination: false,
      select: { title: true, slug: true, status: true, location: true, updatedAt: true },
    }),
    payload.find({
      collection: 'job-applications',
      sort: '-createdAt',
      limit: 200,
      depth: 0,
      pagination: false,
    }),
  ])
  return Response.json({
    settings: settings && {
      applicationRecipients: settings.applicationRecipients,
      resendSince: settings.resendSince ?? null,
      lastResend: settings.lastResend ?? null,
    },
    jobs: jobs.docs,
    applications: applications.docs.map((a) => ({
      id: a.id,
      submissionId: a.submissionId,
      jobTitle: a.jobTitle,
      fullName: a.fullName,
      email: a.email,
      phone: a.phone,
      availability: a.availability,
      experience: a.experience,
      technology: a.technology,
      notificationStatus: a.notificationStatus,
      createdAt: a.createdAt,
      // Never expose storage paths; OS asks for a short-lived link per file.
      files: ((a.attachments as Attachment[] | null) || []).map((f) => ({
        kind: f.kind,
        name: f.name,
        size: f.size,
      })),
    })),
  })
}
