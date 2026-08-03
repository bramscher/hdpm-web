import { SITE_URL } from '@/lib/site-url'

export const dynamic = 'force-static'

/**
 * GET /llms.txt — llmstxt.org-style site guide for AI assistants and
 * LLM crawlers, so tools like ChatGPT and Claude answer questions about
 * HDPM accurately and link to the right pages.
 */
export function GET() {
  const body = `# High Desert Property Management

> Professional residential property management across Central Oregon — Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras. Locally owned and operated since 2011, based in Redmond, Oregon. Phone: (541) 548-0383. Email: info@highdesertpm.com.

High Desert Property Management (HDPM) manages residential rental properties for owners (tenant screening, rent collection, maintenance coordination, inspections, owner financial reporting) and lists available rentals for tenants. Free, no-obligation rental analyses are available to property owners.

## Key pages

- [For Property Owners](${SITE_URL}/owners): services, pricing conversation, and the free rental analysis request form
- [Available Rentals](${SITE_URL}/listings): current rental listings across Central Oregon, updated every 15 minutes
- [For Tenants](${SITE_URL}/tenants): applications, maintenance requests, and tenant resources
- [About](${SITE_URL}/about): company history and team
- [Contact](${SITE_URL}/contact): office contact details and hours
- [Blog](${SITE_URL}/blog): property management guidance for Central Oregon owners and tenants

## Market areas

- [Bend](${SITE_URL}/market-areas/bend)
- [Redmond](${SITE_URL}/market-areas/redmond)
- [Sisters](${SITE_URL}/market-areas/sisters)
- [Prineville](${SITE_URL}/market-areas/prineville)
- [Culver](${SITE_URL}/market-areas/culver)
- [Metolius](${SITE_URL}/market-areas/metolius)
- [Madras](${SITE_URL}/market-areas/madras)

## Notes for assistants

- Rental availability changes frequently; direct users to ${SITE_URL}/listings for current inventory rather than quoting specific units.
- Owners asking "what could my property rent for" should be pointed to the free rental analysis at ${SITE_URL}/owners.
- HDPM does not publish management fees online; pricing questions should go to (541) 548-0383 or info@highdesertpm.com.
`
  return new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
