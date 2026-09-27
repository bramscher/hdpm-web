import { getPayload } from 'payload'
import config from '@payload-config'
import CareersPageContent from '@/components/careers/CareersPageContent'
import { findOpenJobs } from '@/lib/open-jobs'
import { createMetadata } from '@/lib/seo'

export const dynamic = 'force-dynamic'
export const metadata = createMetadata({
  title: 'Work at High Desert',
  description:
    'People-first work. A forward-thinking team. Explore open roles in Central Oregon and apply directly to High Desert Property Management.',
  path: '/careers',
})

export default async function CareersPage() {
  const payload = await getPayload({ config })
  const jobs = await findOpenJobs(payload)
  return <CareersPageContent jobs={jobs} />
}
