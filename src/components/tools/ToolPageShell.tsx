import Link from 'next/link'
import type { ReactNode } from 'react'
import Section from '@/components/ui/Section'
import Card from '@/components/ui/Card'
import Reveal from '@/components/ui/Reveal'
import LeadForm from '@/components/forms/LeadForm'
import { breadcrumbSchema, faqSchema } from '@/lib/schema'
import { SITE_URL } from '@/lib/site-url'
import { TOOLS, TOOLS_BASE, type ToolMeta } from '@/lib/tools/registry'

interface ToolPageShellProps {
  tool: ToolMeta
  /** Sentence(s) under the H1. */
  intro: string
  /** The interactive calculator (a client component). */
  children: ReactNode
  faqs: { question: string; answer: string }[]
  /** GA tag + CRM source detail for the lead form on this tool. */
  analyticsTag: string
}

/**
 * Server-rendered scaffold shared by every /tools calculator: breadcrumb +
 * FAQ JSON-LD, hero, the calculator, an FAQ section, related tools, and the
 * shared rental-analysis lead form.
 */
export default function ToolPageShell({ tool, intro, children, faqs, analyticsTag }: ToolPageShellProps) {
  const path = `${TOOLS_BASE}/${tool.slug}`
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tools', url: `${SITE_URL}${TOOLS_BASE}` },
    { name: tool.short, url: `${SITE_URL}${path}` },
  ])
  const related = TOOLS.filter((t) => t.slug !== tool.slug)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      {faqs.length > 0 && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema(faqs)) }} />
      )}

      <Section tone="white">
        <Reveal>
          <nav aria-label="Breadcrumb" className="mb-6 text-sm text-neutral-mid">
            <Link href="/" className="hover:text-accent">Home</Link>
            <span className="px-2">/</span>
            <Link href={TOOLS_BASE} className="hover:text-accent">Tools</Link>
            <span className="px-2">/</span>
            <span className="text-neutral-dark">{tool.short}</span>
          </nav>
          <h1 className="font-heading text-display font-extrabold tracking-tight text-neutral-dark">{tool.title}</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-mid">{intro}</p>
        </Reveal>
        <Reveal delay={0.05} className="mt-10">
          {children}
        </Reveal>
      </Section>

      {faqs.length > 0 && (
        <Section tone="muted">
          <Reveal>
            <h2 className="font-heading text-title font-bold text-neutral-dark">Frequently asked questions</h2>
          </Reveal>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {faqs.map((f, i) => (
              <Reveal key={f.question} delay={Math.min(i, 3) * 0.05}>
                <Card className="h-full p-6">
                  <h3 className="font-heading text-heading text-neutral-dark">{f.question}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-neutral-mid">{f.answer}</p>
                </Card>
              </Reveal>
            ))}
          </div>
        </Section>
      )}

      <Section tone="white">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <h2 className="font-heading text-title font-bold text-neutral-dark">
              Want the numbers for your actual property?
            </h2>
            <p className="mt-4 text-lg leading-relaxed text-neutral-mid">
              These calculators use your assumptions. For a real estimate grounded in current Central
              Oregon lease data — Bend, Redmond, Sisters, Prineville, and beyond — request a free,
              no-obligation rental analysis.
            </p>
            <div className="mt-8">
              <h3 className="font-heading text-heading text-neutral-dark">More free tools</h3>
              <ul className="mt-3 space-y-2">
                {related.map((t) => (
                  <li key={t.slug}>
                    <Link href={`${TOOLS_BASE}/${t.slug}`} className="font-semibold text-accent-dark hover:underline">
                      {t.short}
                    </Link>
                    <span className="text-neutral-mid"> — {t.blurb}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <Card className="p-6 sm:p-8">
              <LeadForm sourceDetail={`Tool: ${tool.title}`} analyticsTag={analyticsTag} />
            </Card>
          </Reveal>
        </div>
      </Section>
    </>
  )
}
