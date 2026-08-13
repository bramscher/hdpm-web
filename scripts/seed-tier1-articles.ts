/**
 * Seed the four Tier-1 owner-intent SEO articles as DRAFTS for review.
 *
 * These target the commercial-intent queries that were leaking clicks in GSC
 * (Redmond/Bend "property management" + cost + "how to choose"). Each links up
 * to its canonical money page (/market-areas/{city}) with exact-match anchor
 * text plus an /owners CTA — supporting spokes for the city hub pages.
 *
 * Draft status: public read access filters to published, so these stay
 * admin-only until an editor reviews and publishes them.
 *
 * Editorial guardrails (matches the blog/SEO agents): no specific fee numbers
 * or door counts, "since 2011", owner-focused and constructive.
 *
 * Idempotent: skips a slug that already exists.
 *
 * Usage: npx tsx scripts/seed-tier1-articles.ts
 */
import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

// ─── Lexical helpers ────────────────────────────────────────────────
type Node = Record<string, unknown>

const t = (text: string): Node => ({
  type: 'text',
  text,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
  version: 1,
})

const a = (url: string, text: string): Node => ({
  type: 'link',
  version: 3,
  fields: { linkType: 'custom', url, newTab: false },
  direction: 'ltr',
  format: '',
  indent: 0,
  children: [t(text)],
})

const heading = (text: string, tag: 'h2' | 'h3' = 'h2'): Node => ({
  type: 'heading',
  tag,
  children: [t(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
})

const p = (text: string): Node => ({
  type: 'paragraph',
  children: [t(text)],
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

// paragraph with mixed text/link children
const pc = (...children: Node[]): Node => ({
  type: 'paragraph',
  children,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  textFormat: 0,
  textStyle: '',
})

const bullets = (items: string[]): Node => ({
  type: 'list',
  listType: 'bullet',
  tag: 'ul',
  start: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  version: 1,
  children: items.map((text, i) => ({
    type: 'listitem',
    value: i + 1,
    checked: undefined,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    children: [t(text)],
  })),
})

const rt = (blocks: Node[]) => ({
  root: {
    type: 'root',
    children: blocks,
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  },
})

const REDMOND = '/market-areas/redmond'
const BEND = '/market-areas/bend'
const OWNERS = '/owners'

// ─── Articles ───────────────────────────────────────────────────────
interface Article {
  slug: string
  title: string
  metaTitle: string
  metaDescription: string
  tags: string[]
  blocks: Node[]
}

const ARTICLES: Article[] = [
  {
    slug: 'property-management-cost-redmond-oregon',
    title: 'How Much Does Property Management Cost in Redmond, Oregon?',
    metaTitle: 'Property Management Cost in Redmond, Oregon',
    metaDescription:
      'What property management actually costs in Redmond, OR — the common fee structures, what drives the price, and what should be included. Plus a free rental analysis.',
    tags: ['Redmond', 'Property Management', 'Owners', 'Cost'],
    blocks: [
      p(
        'If you own a rental in Redmond, one of the first questions you probably have about hiring a manager is simple: what does it cost? The honest answer is that it depends — on your property, the services you need, and how the company charges. Understanding the common pricing models makes it much easier to compare options and spot a bad deal dressed up as a cheap one.',
      ),
      heading('The common property management fee structures'),
      p(
        'Most residential managers in Central Oregon build their pricing from a few standard pieces. Knowing the vocabulary lets you compare quotes apples-to-apples:',
      ),
      bullets([
        'Monthly management fee — usually a percentage of the rent collected, covering day-to-day management, rent collection, owner reporting, and tenant communication.',
        'Leasing or tenant-placement fee — a one-time charge when a new tenant is placed, covering marketing, showings, screening, and lease preparation.',
        'Lease-renewal fee — a smaller fee to re-paper and re-qualify an existing tenant, which keeps a good renter in place and avoids turnover.',
        'Maintenance coordination — often included in the management fee, with repair costs themselves billed to the owner at cost.',
      ]),
      p(
        'A quote is only meaningful once you know which of these it includes. A low headline percentage can hide setup fees, marketing charges, markups on maintenance, or vacancy fees that add up to more than a transparent, slightly higher rate.',
      ),
      heading('What drives the cost up or down in Redmond'),
      p(
        'Redmond is Central Oregon’s value market, and that shapes management pricing. Single-family homes are the bulk of the rental stock, tenant demand is deep, and vacancies tend to be short — all of which keep management efficient. Cost tends to move with the property type (a single home versus a small multiplex), its condition, and the level of service you want, from full-service hands-off management to leasing-only placement.',
      ),
      heading('Why the cheapest option usually isn’t'),
      p(
        'The largest costs in owning a rental aren’t management fees — they’re vacancy, bad tenants, and deferred maintenance. A manager who screens thinly to fill a unit fast, or who is slow to handle repairs, can cost you far more in a single bad tenancy than you’d ever save on a discounted fee. When you compare quotes, weight screening rigor, maintenance responsiveness, and Oregon legal compliance at least as heavily as the percentage.',
      ),
      heading('Get a straight answer for your property'),
      pc(
        t('We quote every property individually rather than publish a one-size number, because the right fee depends on your home and your goals. Our '),
        a(REDMOND, 'Redmond property management'),
        t(' team will walk you through exactly what’s included, and a free '),
        a(OWNERS, 'rental analysis'),
        t(' gives you a realistic rent range and days-on-market estimate with no obligation. High Desert Property Management has managed Redmond rentals from our office here since 2011.'),
      ),
    ],
  },
  {
    slug: 'how-to-choose-property-management-company-redmond',
    title: 'How to Choose a Property Management Company in Redmond',
    metaTitle: 'How to Choose a Property Management Company in Redmond',
    metaDescription:
      'A Redmond rental owner’s checklist for choosing a property manager — local presence, screening, maintenance, Oregon compliance, communication, and fee transparency.',
    tags: ['Redmond', 'Property Management', 'Owners', 'Landlord Tips'],
    blocks: [
      p(
        'Handing your Redmond rental to a management company is a big decision — the right partner protects your investment and your time, and the wrong one costs you both. Here’s what to look for when you evaluate property managers in Redmond and Central Oregon.',
      ),
      heading('1. Genuine local presence'),
      p(
        'Redmond rewards managers who are actually here. Pricing a rental well is a street-by-street exercise, not a metro average, and when a pipe bursts on a February night, a local team and local vendors matter. Ask where the company’s office is, where its maintenance staff is based, and how many Redmond-area properties it manages.',
      ),
      heading('2. A rigorous, consistent screening process'),
      p(
        'Tenant placement is the single most important decision in the rental lifecycle. Ask exactly what a company screens for — credit, income and employment verification, rental history and landlord references, and background checks — and confirm every applicant is evaluated against the same written, fair-housing-compliant criteria. Consistency protects you legally and financially.',
      ),
      heading('3. Maintenance and a real vendor network'),
      p(
        'Central Oregon’s climate is hard on homes, and deferred maintenance quietly erodes returns. Look for 24/7 maintenance intake for tenants, an established network of licensed local vendors, and clear rules about when the company acts versus when it calls you for approval.',
      ),
      heading('4. Oregon legal compliance'),
      p(
        'Oregon has some of the most detailed landlord-tenant law in the country — statewide rent-increase limits, specific notice periods, and strict deposit accounting. A good manager keeps your leases, notices, and rent adjustments current with the law as it changes, so you’re not tracking Salem yourself.',
      ),
      heading('5. Communication, reporting, and transparent fees'),
      p(
        'You should be able to see how your property is performing without chasing anyone. Ask about the owner portal, how often you get statements, and how quickly the team responds. On fees, insist on a plain-language breakdown of every charge — management, leasing, renewals, and anything else — so you can compare quotes honestly.',
      ),
      heading('The Redmond advantage'),
      pc(
        t('If you’d like to see how these standards look in practice, learn about our '),
        a(REDMOND, 'Redmond property management'),
        t(' services, or '),
        a(OWNERS, 'request a free rental analysis'),
        t(' for your property. We’ve managed Redmond rentals from our local office since 2011.'),
      ),
    ],
  },
  {
    slug: 'how-to-choose-property-management-company-bend',
    title: 'What to Look for in a Bend, Oregon Property Management Company',
    metaTitle: 'Choosing a Bend, Oregon Property Management Company',
    metaDescription:
      'How Bend rental owners should evaluate property management companies — local pricing knowledge, screening, maintenance, short-term-rental rules, and fee transparency.',
    tags: ['Bend', 'Property Management', 'Owners', 'Landlord Tips'],
    blocks: [
      p(
        'Bend has one of the most visible, competitive rental markets in Oregon, and the property management company you choose has a direct effect on your vacancy days and your net return. If you’re comparing Bend property management companies, these are the things that actually separate them.',
      ),
      heading('Neighborhood-level pricing knowledge'),
      p(
        'The same three-bedroom home rents very differently in NorthWest Crossing than it does east of 27th Street. A manager who prices off city-wide averages will either leave money on the table or let your home sit empty. Ask how a company sets rent, and whether it compares your property against recently rented homes in its own neighborhood.',
      ),
      heading('Screening that protects the investment'),
      p(
        'In a market where homes can rent quickly, it’s tempting to place the first applicant. Resist it. Ask any Bend company to walk you through its screening: credit, income and employment verification, rental history, and consistent fair-housing-compliant criteria applied to every applicant. Strong screening is why some portfolios see very few late payments and evictions.',
      ),
      heading('Maintenance built for the high desert'),
      p(
        'Freeze-thaw cycles, juniper and pine debris, and winter storms all test Bend rentals. Look for a manager with 24/7 maintenance intake, a trusted network of local vendors at relationship pricing, and a preventative approach with documented move-in, move-out, and periodic inspections.',
      ),
      heading('Short-term vs. long-term guidance'),
      p(
        'Bend regulates short-term rentals tightly, and in most residential zones new permits are limited by a buffer rule. A good manager gives you honest, property-specific guidance on whether a long-term rental is the stronger play rather than a generic pitch either way.',
      ),
      heading('Transparent fees and clear communication'),
      p(
        'Ask for a plain-language breakdown of every fee, and confirm how you’ll see performance — owner portal, statement frequency, and response times. The cheapest headline rate is rarely the lowest true cost once hidden charges and slow service are counted.',
      ),
      heading('See it in practice'),
      pc(
        t('Learn how our '),
        a(BEND, 'Bend property management'),
        t(' team applies these standards for local owners, or '),
        a(OWNERS, 'get a free rental analysis'),
        t(' for your Bend property. High Desert Property Management has served Central Oregon owners since 2011.'),
      ),
    ],
  },
  {
    slug: 'property-management-cost-bend-oregon',
    title: 'What Does Property Management Cost in Bend, Oregon?',
    metaTitle: 'Property Management Cost in Bend, Oregon',
    metaDescription:
      'Understand what property management costs in Bend, OR — common fee structures, what drives the price in a competitive market, and what should be included.',
    tags: ['Bend', 'Property Management', 'Owners', 'Cost'],
    blocks: [
      p(
        'Bend rental owners weighing professional management almost always start with cost — and it’s a fair question. Rather than a single number that fits nobody, here’s how property management pricing actually works in Bend, so you can compare quotes with confidence.',
      ),
      heading('The pieces of a management quote'),
      p('Most Bend residential managers price from a handful of standard components:'),
      bullets([
        'Monthly management fee — typically a percentage of collected rent, covering day-to-day management, rent collection, reporting, and tenant communication.',
        'Leasing / tenant-placement fee — a one-time fee when a new tenant is placed, covering marketing, showings, screening, and the lease.',
        'Lease-renewal fee — a smaller charge to retain a good tenant and avoid a costly turnover.',
        'Maintenance — coordination is often included; the repair costs themselves are billed to the owner.',
      ]),
      heading('What moves the price in Bend'),
      p(
        'Bend’s market shapes cost in specific ways. Higher rents on the westside change the math of percentage-based fees, premium properties carry higher expectations for marketing and turnover work, and the level of service you choose — full-service versus leasing-only — is the biggest lever. Property type and condition matter too: a well-maintained single-family home is simpler to manage than a tired multiplex.',
      ),
      heading('Vacancy is the real cost'),
      p(
        'In a visible market like Bend, pricing and presentation decide how long a home sits empty — and every vacant week costs far more than a point of management fee. The value of a good manager shows up in shorter vacancies, better tenants, and fewer expensive surprises, not in the headline rate. Weigh screening rigor and maintenance responsiveness accordingly.',
      ),
      heading('Watch for hidden fees'),
      p(
        'A low advertised percentage can conceal setup fees, marketing charges, maintenance markups, or vacancy fees. Ask for every charge in writing and compare the total picture, not just the first number on the page.',
      ),
      heading('A quote built for your property'),
      pc(
        t('We price each property individually based on your home and goals. Learn about our '),
        a(BEND, 'Bend property management'),
        t(' services, or start with a free '),
        a(OWNERS, 'rental analysis'),
        t(' — a realistic rent range and management plan with no obligation. Serving Central Oregon since 2011.'),
      ),
    ],
  },
]

async function main() {
  const payload = await getPayload({ config })

  for (const art of ARTICLES) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: art.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      console.log(`OUT ✓  ${art.slug}: already exists — skipped`)
      continue
    }
    await payload.create({
      collection: 'posts',
      data: {
        title: art.title,
        slug: art.slug,
        status: 'draft',
        author: 'High Desert Property Management',
        tags: art.tags.map((tag) => ({ tag })),
        body: rt(art.blocks),
        meta: { title: art.metaTitle, description: art.metaDescription },
      } as never,
    })
    const words = art.blocks
      .flatMap((b) => JSON.stringify(b).match(/"text":"[^"]+"/g) ?? [])
      .join(' ')
      .split(/\s+/).length
    console.log(`OUT ✏️  ${art.slug}: created draft (~${words} words)`)
  }

  console.log('OUT ✅ Done. Review under Admin → Content → Posts (status: Draft).')
  process.exit(0)
}

main().catch((err) => {
  console.error('ERR', err)
  process.exit(1)
})
