'use client'
import { useState } from 'react'
import Image from 'next/image'
import { careerRoleImage } from '@/lib/career-role-images'
import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Job } from '@/payload-types'
import ApplicationForm from './ApplicationForm'
import { compactJobDescription } from '@/lib/job-description-format'
import styles from './JobDescription.module.css'

export default function CareersExperience({ jobs }: { jobs: Job[] }) {
  const [selectedJob, setSelectedJob] = useState('')
  function apply(id: number) {
    setSelectedJob(String(id))
    document.getElementById('application')?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    })
    document.getElementById('application-job')?.focus({ preventScroll: true })
  }
  return (
    <>
      <section
        id="open-positions"
        className="scroll-mt-24 bg-[#f7f6f2] py-16 sm:py-24"
      >
        <div className="mx-auto max-w-6xl px-5 sm:px-8">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[.18em] text-[#246b38]">
                FIND YOUR PLACE
              </p>
              <h2 className="mt-3 font-heading text-4xl text-primary sm:text-5xl">
                Good people. Meaningful work.
              </h2>
            </div>
            <span className="rounded-full border border-neutral-300 px-4 py-2 text-sm text-neutral-mid">
              {jobs.length} open {jobs.length === 1 ? 'role' : 'roles'}
            </span>
          </div>
          <p className="mb-8 max-w-2xl leading-relaxed text-neutral-mid">
            From the first phone call to the finishing touches on a home, every
            role makes a difference. Explore a position, then tell us about
            yourself.
          </p>
          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white divide-y divide-neutral-200">
            {jobs.map((job, index) => {
              const roleImage = careerRoleImage(job)
              return (
                <article
                  key={job.id}
                  id={job.slug}
                  className="scroll-mt-28 p-5 sm:p-7"
                >
                  <div className="grid grid-cols-[96px_minmax(0,1fr)] items-start gap-4 sm:flex sm:gap-5">
                    {roleImage ? (
                      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-neutral-100 sm:h-32 sm:w-48">
                        <Image
                          src={roleImage.src}
                          alt={roleImage.alt}
                          fill
                          sizes="(min-width: 640px) 192px, 96px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="hidden pt-1 font-mono text-sm text-neutral-400 sm:block"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                    )}
                    <div className="contents sm:block sm:min-w-0 sm:flex-1">
                      <div
                        className={`${roleImage ? '' : 'col-span-2'} flex flex-wrap items-center justify-between gap-2`}
                      >
                        <h3 className="font-heading text-xl font-semibold leading-tight text-primary sm:text-2xl">
                          {job.title}
                        </h3>
                        <button
                          onClick={() => apply(job.id)}
                          aria-label={`Apply for ${job.title}`}
                          className="rounded-full border border-primary/20 px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-white"
                        >
                          Apply <span aria-hidden="true">↗</span>
                        </button>
                      </div>
                      <div className="col-span-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-mid sm:mt-2">
                        {[
                          job.location || 'Central Oregon',
                          job.schedule,
                          job.compensation,
                        ]
                          .filter(Boolean)
                          .map((text, i) => (
                            <span key={i}>{text}</span>
                          ))}
                      </div>
                      <details className="group col-span-2 sm:mt-3">
                        <summary className="w-fit cursor-pointer text-sm font-semibold text-[#246b38]">
                          About this role{' '}
                          <span
                            aria-hidden="true"
                            className="ml-1 inline-block transition group-open:rotate-45"
                          >
                            +
                          </span>
                        </summary>
                        <div className="mt-3 max-w-3xl border-l-2 border-accent/30 pl-4">
                          <p className="leading-normal text-neutral-mid">
                            {job.summary}
                          </p>
                          {job.description && (
                            <div className={`${styles.description} mt-3 text-neutral-mid`}>
                              <RichText data={compactJobDescription(job.description)} />
                            </div>
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                </article>
              )
            })}
            {!jobs.length && (
              <div className="p-8">
                <h3 className="font-heading text-2xl text-primary">
                  No openings just now.
                </h3>
                <p className="mt-3 text-neutral-mid">
                  Check back for your next opportunity with High Desert.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>
      {jobs.length > 0 && (
        <section
          id="application"
          className="scroll-mt-24 bg-[#eeeee7] py-16 sm:py-24"
        >
          <div className="mx-auto grid max-w-6xl items-start gap-10 px-5 sm:px-8 lg:grid-cols-[.7fr_1.3fr]">
            <aside className="lg:sticky lg:top-28">
              <p className="text-xs font-semibold tracking-[.18em] text-[#246b38]">
                ONE FORM. YOUR NEXT STEP.
              </p>
              <h2 className="mt-4 font-heading text-4xl leading-tight text-primary sm:text-5xl">
                Bring your skills.
                <br />
                And your curiosity.
              </h2>
              <p className="mt-6 leading-relaxed text-neutral-mid">
                You don’t need to know every platform. You do need to be
                comfortable with technology, willing to learn, and ready to
                communicate clearly.
              </p>
              <div className="mt-8 border-t border-primary/15 pt-6">
                <h3 className="font-semibold text-primary">
                  What happens next
                </h3>
                <ol className="mt-4 space-y-5 text-sm text-neutral-mid">
                  <li>
                    <span className="mr-3 font-mono text-[#246b38]">01</span>
                    Choose a role and complete your application.
                  </li>
                  <li>
                    <span className="mr-3 font-mono text-[#246b38]">02</span>Our
                    team reviews your experience and interests.
                  </li>
                  <li>
                    <span className="mr-3 font-mono text-[#246b38]">03</span>If
                    it looks like a fit, we’ll connect with you.
                  </li>
                </ol>
              </div>
              <p className="mt-9 text-sm text-neutral-mid">
                Need a hand with your application?
                <br />
                <a
                  href="mailto:work@highdesertpm.com"
                  className="mt-1 inline-block font-semibold text-primary underline underline-offset-4"
                >
                  work@highdesertpm.com
                </a>
              </p>
            </aside>
            <ApplicationForm
              jobs={jobs.map(({ id, title }) => ({ id, title }))}
              selectedJob={selectedJob}
              onJobChange={setSelectedJob}
            />
          </div>
        </section>
      )}
    </>
  )
}
