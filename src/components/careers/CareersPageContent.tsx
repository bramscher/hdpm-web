import Button from '@/components/ui/Button'
import CareersExperience from './CareersExperience'
import type { Job } from '@/payload-types'

export default function CareersPageContent({ jobs }: { jobs: Job[] }) {
  return (
    <>
      <section className="relative overflow-hidden bg-primary py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 -top-36 h-[650px] w-[650px] rounded-full border border-white/10"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-16 h-[490px] w-[490px] rounded-full border border-white/10"
        />
        <div className="relative mx-auto grid max-w-6xl items-end gap-12 px-5 sm:px-8 lg:grid-cols-[1.5fr_1fr]">
          <div>
            <p className="text-xs font-semibold tracking-[.2em] text-accent">
              CAREERS AT HIGH DESERT · CENTRAL OREGON
            </p>
            <h1 className="mt-6 font-heading text-5xl font-semibold leading-[1.06] tracking-tight text-white sm:text-7xl">
              Great places.
              <br />
              Even better <span className="text-[#d7dda9]">people.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/75">
              Care for homes. Help people feel at home. Build your next chapter
              with High Desert Property Management.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="#open-positions" size="lg" withArrow>
                Find your role
              </Button>
              <Button href="/about" variant="glass" size="lg">
                Meet High Desert
              </Button>
            </div>
          </div>
          <div className="rounded-3xl border border-white/20 bg-white/5 p-7 sm:p-9">
            <span className="text-xs font-semibold tracking-[.15em] text-[#d7dda9]">
              LOCAL ROOTS. FORWARD THINKING.
            </span>
            <p className="mt-5 font-heading text-2xl leading-snug text-white">
              People who care.
              <br />
              Tools that help.
              <br />
              Work you can take pride in.
            </p>
            <p className="mt-5 text-sm leading-relaxed text-white/70">
              We bring a human touch to property management—and a practical
              mindset to the technology that keeps us moving.
            </p>
            <div className="mt-7 flex items-center gap-3 border-t border-white/15 pt-5 text-xs tracking-wide text-white/70">
              <span className="h-2 w-2 rounded-full bg-[#d7dda9]" />
              AT HOME IN CENTRAL OREGON
            </div>
          </div>
        </div>
      </section>
      <section className="bg-white py-12 sm:py-16">
        <div className="mx-auto grid max-w-6xl gap-8 px-5 sm:grid-cols-3 sm:px-8">
          {[
            [
              '01 / PEOPLE FIRST',
              'Make someone’s day better.',
              'A clear answer. A thoughtful repair. A home ready for its next resident. The details matter because people do.',
            ],
            [
              '02 / TECH COMFORTABLE',
              'Bring a learn-it mindset.',
              'Digital work orders, shared calendars, photos, and online communication are part of the job. Be ready to use the tools and learn new ones.',
            ],
            [
              '03 / TAKE OWNERSHIP',
              'Be proud of the follow-through.',
              'Notice what needs attention, communicate with your teammates, and help bring the work across the finish line.',
            ],
          ].map(([eyebrow, title, copy]) => (
            <div key={eyebrow} className="border-t border-neutral-200 pt-5">
              <p className="text-[11px] font-semibold tracking-widest text-[#246b38]">
                {eyebrow}
              </p>
              <h2 className="mt-4 font-heading text-xl font-semibold text-primary">
                {title}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
                {copy}
              </p>
            </div>
          ))}
        </div>
      </section>
      <CareersExperience jobs={jobs} />
    </>
  )
}
