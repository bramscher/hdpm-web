import Link from 'next/link'
import { createMetadata } from '@/lib/seo'
import { breadcrumbSchema } from '@/lib/schema'
import { SITE_URL } from '@/lib/site-url'
import Section from '@/components/ui/Section'
import Card from '@/components/ui/Card'
import Reveal from '@/components/ui/Reveal'
import Button from '@/components/ui/Button'
import { TOOLS, TOOLS_BASE } from '@/lib/tools/registry'

export function generateMetadata() {
  return createMetadata({
    title: 'Free Rental Property Tools & Calculators',
    description:
      'Free calculators for Central Oregon rental owners and investors: rental ROI, cap rate, and rent-vs-sell. Instant results, no signup required.',
    path: TOOLS_BASE,
  })
}

export default function ToolsHubPage() {
  const breadcrumb = breadcrumbSchema([
    { name: 'Home', url: SITE_URL },
    { name: 'Tools', url: `${SITE_URL}${TOOLS_BASE}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <Section tone="white">
        <Reveal>
          <h1 className="font-heading text-display font-extrabold tracking-tight text-neutral-dark">
            Free tools for rental owners & investors
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-neutral-mid">
            Run the numbers on a Central Oregon rental in seconds. Every calculator gives instant
            results in your browser — no signup, no obligation.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TOOLS.map((t, i) => (
            <Reveal key={t.slug} delay={Math.min(i, 3) * 0.05}>
              <Card as={Link} href={`${TOOLS_BASE}/${t.slug}`} interactive className="flex h-full flex-col p-6">
                <h2 className="font-heading text-subtitle font-bold text-neutral-dark">{t.short}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-neutral-mid">{t.blurb}</p>
                <span className="mt-4 font-semibold text-accent-dark">Open calculator →</span>
              </Card>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.1} className="mt-12">
          <Card className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-heading text-subtitle font-bold text-neutral-dark">
                Prefer a real estimate for your property?
              </h2>
              <p className="mt-1 text-neutral-mid">
                Get a free, no-obligation rental analysis built on current Central Oregon lease data.
              </p>
            </div>
            <Button href="/owners" variant="primary" size="lg" withArrow>
              Get my free rental analysis
            </Button>
          </Card>
        </Reveal>
      </Section>
    </>
  )
}
