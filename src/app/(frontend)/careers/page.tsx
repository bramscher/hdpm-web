import Link from 'next/link'
import { getPayload } from 'payload'
import { RichText } from '@payloadcms/richtext-lexical/react'
import config from '@payload-config'
import Button from '@/components/ui/Button'
import { createMetadata } from '@/lib/seo'
import { isJobPostingURL } from '@/lib/job-links'

export const dynamic = 'force-dynamic'
export const metadata = createMetadata({
  title: 'Work at High Desert',
  description: 'Join High Desert Property Management. Explore current job opportunities with our Central Oregon team.',
  path: '/careers',
})

export default async function CareersPage() {
  const payload = await getPayload({ config })
  const { docs: jobs } = await payload.find({
    collection: 'jobs',
    overrideAccess: false,
    where: { status: { equals: 'open' } },
    sort: ['order', 'title'],
    pagination: false,
    depth: 0,
  })

  return (
    <>
      <section className="bg-primary py-20 sm:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="font-heading text-overline uppercase text-accent">Join Us</p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-bold tracking-tight text-white sm:text-6xl">Work at High Desert</h1>
          <p className="mt-6 max-w-2xl text-body-lg text-white/80">
            Good property management starts with people who care. Help us support
            residents, owners, and homes throughout Central Oregon.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button href="#open-positions" size="lg" withArrow>Explore Open Positions</Button>
            <Button href="/about" variant="glass" size="lg">Meet High Desert</Button>
          </div>
        </div>
      </section>
      <section id="open-positions" className="scroll-mt-24 bg-neutral-light py-16 sm:py-24">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="font-heading text-overline uppercase text-accent">Find Your Role</p>
          <h2 className="mt-3 font-heading text-title text-neutral-dark">Open Positions</h2>
          <p className="mt-4 text-body-lg text-neutral-mid">Explore our opportunities and get in touch. When a job board link is available, you can view the posting and apply there.</p>
          <div className="mt-10 space-y-6">
            {jobs.map((job) => (
              <article key={job.id} id={job.slug} className="scroll-mt-24 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm sm:p-9">
                <h3 className="font-heading text-2xl font-semibold text-neutral-dark">
                  <Link href={`/careers#${job.slug}`} className="hover:text-accent">{job.title}</Link>
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[job.location, job.schedule, job.compensation].filter(Boolean).map((detail, index) => (
                    <span key={index} className="rounded-full bg-neutral-light px-3 py-1 text-sm text-neutral-dark">{detail}</span>
                  ))}
                </div>
                <p className="mt-5 whitespace-pre-line leading-relaxed text-neutral-mid">{job.summary}</p>
                {job.description && <div className="prose mt-5 max-w-none"><RichText data={job.description} /></div>}
                <div className="mt-6 flex flex-wrap gap-3">
                  {job.postingLinks?.filter((link) => isJobPostingURL(link.url)).map((link) => (
                    <a key={link.id ?? link.url} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark">
                      View on {link.label}<span className="sr-only"> (opens in a new tab)</span><span aria-hidden="true" className="ml-2">↗</span>
                    </a>
                  ))}
                  {job.contactEmail && <Button href={`mailto:${job.contactEmail}?subject=${encodeURIComponent(`Job inquiry: ${job.title}`)}`} variant="outline">Ask About This Role</Button>}
                </div>
              </article>
            ))}
            {jobs.length === 0 && (
              <div className="rounded-2xl border border-neutral-200 bg-white p-8">
                <h3 className="font-heading text-heading text-neutral-dark">No open positions right now</h3>
                <p className="mt-3 text-neutral-mid">Please check back for new opportunities with High Desert.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
