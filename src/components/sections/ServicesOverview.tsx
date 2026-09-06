import Link from 'next/link'
import Reveal from '@/components/ui/Reveal'
import Section from '@/components/ui/Section'

const services = [
  {
    title: 'Property Management',
    description:
      'Full-service management from tenant screening to lease enforcement. We handle the day-to-day so you can focus on what matters.',
    href: '/owners',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
      </svg>
    ),
  },
  {
    title: 'Tenant Placement',
    description:
      'Rigorous screening with background checks, credit reports, and rental history verification. We find tenants who pay on time and care for your property.',
    href: '/owners#tenant-placement',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    title: 'Maintenance Coordination',
    description:
      'Our trusted network of licensed Central Oregon contractors handles repairs quickly and cost-effectively. 24/7 emergency response included.',
    href: '/owners#maintenance',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384 5.383a2.1 2.1 0 01-2.97-2.97l5.384-5.383m1.414-1.414l1.414-1.414a2.1 2.1 0 012.97 0l1.414 1.414a2.1 2.1 0 010 2.97l-1.414 1.414M7.5 10.5l4-4m2 8l4-4m-8.5 8.5l-1.5 1.5m6-14l1.5-1.5" />
      </svg>
    ),
  },
  {
    title: 'Financial Reporting',
    description:
      'Monthly owner statements, year-end tax documents, and a real-time online portal. Complete transparency into your investment performance.',
    href: '/owners#reporting',
    icon: (
      <svg aria-hidden="true" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
]

export default function ServicesOverview() {
  return (
    <Section tone="muted" className="astra-services">
      {/* Section header */}
      <Reveal className="astra-section-heading max-w-3xl">
        <p className="font-heading text-overline uppercase text-accent">
          What We Do
        </p>
        <h2 className="mt-3 font-heading text-title text-neutral-dark">
          Full-Service Property Management
        </h2>
        <p className="mt-4 text-body-lg text-neutral-mid">
          From finding great tenants to handling midnight emergencies, we take care of
          every detail so your investment thrives.
        </p>
      </Reveal>

      {/* Service cards */}
      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((service, i) => (
          <Reveal key={service.title} delay={Math.min(i, 3) * 0.07}>
            <Link
              href={service.href}
              className="astra-service-card group relative flex flex-col h-full rounded-lg border border-neutral-200 bg-white p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 active:scale-[0.99] motion-reduce:transform-none"
            >
              {/* Icon container */}
              <span className="astra-service-number" aria-hidden="true">0{i + 1}</span>
              <div className="mb-5 inline-flex items-center justify-center rounded-lg bg-accent/10 p-3 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-white">
                {service.icon}
              </div>

              <h3 className="font-heading text-lg font-bold text-neutral-dark">
                {service.title}
              </h3>

              <p className="mt-3 text-sm leading-relaxed text-neutral-mid">
                {service.description}
              </p>

              {/* Hover arrow indicator */}
              <div className="mt-auto pt-8 flex items-center gap-1 text-sm font-semibold text-accent-dark transition-transform duration-300 group-hover:translate-x-1">
                Learn more
                <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>

              {/* Top accent bar on hover */}
              <div className="absolute inset-x-0 top-0 h-0.5 scale-x-0 rounded-t-xl bg-gradient-to-r from-accent to-accent-light transition-transform duration-300 group-hover:scale-x-100" />
            </Link>
          </Reveal>
        ))}
      </div>
    </Section>
  )
}
