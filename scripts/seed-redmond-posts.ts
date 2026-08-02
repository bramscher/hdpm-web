/**
 * Port the three live-site Redmond blog posts (P1-15 in the fix brief) at
 * their original slugs, so /how-to-rent-redmond etc. can 301 to
 * /blog/<same-slug>. Content rewritten from the live posts — tightened,
 * and with factual errors corrected (the live "investing" post listed
 * Microsoft as a Redmond, OR employer and a waterfall that's 90 miles away).
 *
 * Usage: npx tsx scripts/seed-redmond-posts.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

/* ─── Lexical helpers (same shapes as scripts/seed-blog.ts) ─── */

function text(t: string) {
  return { type: 'text', text: t, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }
}
function heading(t: string, tag: 'h2' | 'h3' = 'h2') {
  return { type: 'heading', tag, children: [text(t)], direction: 'ltr', format: '', indent: 0, version: 1 }
}
function paragraph(t: string) {
  return {
    type: 'paragraph',
    children: [text(t)],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}
function bullets(items: string[]) {
  return {
    type: 'list',
    listType: 'bullet',
    tag: 'ul',
    start: 1,
    children: items.map((item, i) => ({
      type: 'listitem',
      value: i + 1,
      children: [text(item)],
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    })),
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}
type Node = ReturnType<typeof heading | typeof paragraph | typeof bullets>
function richText(nodes: Node[]) {
  return { root: { type: 'root', children: nodes, direction: 'ltr', format: '', indent: 0, version: 1 } }
}

/* ─── Posts ─── */

const POSTS = [
  {
    title: 'The Landlord’s Guide to Renting Out Your House in Redmond, OR',
    slug: 'how-to-rent-redmond',
    author: 'Craig Bramscher',
    publishedAt: '2026-04-17T09:00:00.000Z',
    tags: ['Redmond', 'Landlords', 'Renting Out Your Home', 'Oregon Law'],
    seoTitle: 'How to Rent Out Your House in Redmond, OR | HDPM',
    seoDescription:
      'A practical landlord guide to renting out your Redmond, Oregon home: preparation, pricing, Oregon landlord-tenant law, screening, and when professional management pays for itself.',
    body: richText([
      paragraph(
        'Turning your Redmond home into a rental can be a smart way to generate income while holding onto a valuable asset. Central Oregon keeps growing, and Redmond is where much of that growth actually lives — renters who want access to Bend-area jobs, outdoor recreation, and a quieter, more affordable pace. But a rental is a small business, and the owners who succeed treat it like one from day one.',
      ),
      heading('1. Start With a Strategy, Not a Listing'),
      paragraph(
        'Before you photograph a single room, decide what this property is for. Immediate cash flow? A long-term hold you may move back into? The answer shapes your lease terms, your improvement budget, and how much of your own time you’re willing to commit. Map the finances early too: the rent needs to carry the mortgage, taxes, insurance, and maintenance — with a reserve for the month the water heater quits and the tenant gives notice in the same week.',
      ),
      heading('2. Bring the Home Up to Rental Standard'),
      paragraph(
        'Oregon law requires rental housing to be safe, sanitary, and fit for occupancy — that’s the floor, not the goal. Heating matters most in Central Oregon: a furnace that limps through a Redmond January is a habitability problem waiting to happen. Get plumbing, electrical, and appliances into reliable shape, then invest in presentation. Clean, bright, and well-maintained homes rent faster, to better applicants, and come back in better condition.',
      ),
      heading('3. Price It Where the Market Actually Is'),
      paragraph(
        'Redmond rents are their own market — not Bend minus a discount, and not what a national rent estimator guesses. Look at what comparable homes in your neighborhood actually rented for, not what hopeful listings are asking. Overpricing is the most expensive mistake Redmond landlords make: a month of vacancy costs more than a year of being $50 under the top of the range.',
      ),
      heading('4. Take Oregon Landlord-Tenant Law Seriously'),
      paragraph(
        'Oregon has some of the most detailed landlord-tenant law in the country: statewide limits on rent increases, strict security-deposit accounting, specific notice periods, and fair-housing requirements that govern everything from your ad copy to your screening criteria. The rules also change — the legislature adjusts them regularly. Compliance isn’t optional, and mistakes are expensive; if you self-manage, build time into every month for staying current.',
      ),
      heading('5. Build a Real Screening Process'),
      paragraph(
        'Good tenancies are made at screening. That means a consistent, documented process applied identically to every applicant: credit, income and employment verification, rental history, and reference calls. Consistency is both your best risk control and your fair-housing protection. The goal isn’t to fill the home fast — it’s to fill it once.',
      ),
      heading('6. Systematize the Ongoing Work'),
      paragraph(
        'Rent collection, maintenance requests, inspections, renewals, notices — none of it is hard on its own; all of it together, every month, is where self-managing landlords burn out. Decide up front how payments are tracked, how tenants report problems, who answers the phone at 9 PM, and how you’ll document the property’s condition over time.',
      ),
      heading('Where Professional Management Pays For Itself'),
      paragraph(
        'A local management company earns its fee in the gaps: pricing the home correctly the first time, marketing it professionally, screening consistently, coordinating maintenance through established vendors, and keeping every notice and lease clause inside Oregon’s rules. High Desert Property Management has managed Redmond rentals from our Redmond office since 2011 — it’s our home market. If you’d rather own the asset than run the business, that’s exactly the job we do.',
      ),
      heading('Bottom Line'),
      paragraph(
        'Renting out your house in Redmond works when it’s set up right: an honest strategy, a rent-ready home, market-correct pricing, lawful processes, and disciplined screening. Do those five things — or hire a team that does them every day — and a Redmond rental is one of the steadier investments Central Oregon offers. Want to know what your home would rent for? Request a free rental analysis and we’ll send you the numbers within one business day.',
      ),
    ]),
  },
  {
    title: 'Reasons to Invest in Redmond Real Estate',
    slug: 'real-estate-investing-redmond',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-30T09:00:00.000Z',
    tags: ['Redmond', 'Investing', 'Central Oregon', 'Rental Market'],
    seoTitle: 'Why Invest in Redmond, Oregon Real Estate | HDPM',
    seoDescription:
      'Redmond, Oregon offers investors a growing population, a diverse local economy, real affordability relative to Bend and Portland, and steady long-term rental demand. Here’s the case.',
    body: richText([
      paragraph(
        'Most Oregon real estate investors look at Portland, Salem, or Bend. The better question in Central Oregon is often twenty minutes north of Bend: Redmond is one of the fastest-growing small cities in the state, and its combination of affordability and steady rental demand is exactly what long-term investors say they want. Here’s the case, from the team that manages rentals here every day.',
      ),
      heading('A Real Economy, Not Just a Resort Economy'),
      paragraph(
        'Redmond’s employment base is unusually diverse for a city its size: Roberts Field (RDM) — Central Oregon’s commercial airport — plus aviation and firefighting operations at the Redmond Air Center, wood products manufacturers like Bright Wood, medical-device reprocessing at Medline ReNewal, Eagle Crest Resort, healthcare, construction, and the trades. A payroll base that doesn’t depend on a single industry or a ski season is what keeps rent checks steady.',
      ),
      heading('Steady Population Growth'),
      paragraph(
        'Redmond grew from roughly 33,000 residents in 2020 to over 37,000 by mid-decade, and the trajectory hasn’t bent. Much of that growth is households priced out of Bend who still work Bend jobs — they arrive needing housing immediately, and many rent for years. Population growth is the simplest and most durable driver of rental demand there is.',
      ),
      heading('Affordability That Still Pencils'),
      paragraph(
        'Redmond’s median home prices sit in the mid-$400,000s — meaningfully below both Portland and, more importantly, below Bend by an even wider margin. For an investor, that gap is the whole story: comparable rents on a much smaller purchase price means rent-to-price ratios that still work in a way Bend’s westside hasn’t penciled in years.',
      ),
      heading('The Crossroads of Central Oregon'),
      paragraph(
        'Redmond sits where Highways 97 and 126 meet: Bend is 20 minutes south, Sisters 20 minutes west, Prineville 20 minutes east, and the airport is in town. That centrality is a genuine rental amenity — tenants can take a job anywhere in the region without moving — and it insulates demand from any single town’s economy.',
      ),
      heading('Lifestyle That Keeps Demand Renewing'),
      paragraph(
        'Smith Rock State Park is fifteen minutes away, the Cascade lakes and Mt. Bachelor under an hour, and the Deschutes canyon country is out the back door. Add the Redmond School District, a Central Oregon Community College campus, a revitalized downtown with the High Desert Music Hall and the historic Odem Theater, and Eagle Crest Resort west of town — the quality-of-life package keeps drawing the households that fill rentals.',
      ),
      heading('The Bottom Line'),
      paragraph(
        'Redmond pairs small-city affordability with big-region demand, and it rewards patient, long-term rental investors more reliably than its flashier neighbors. If you’re evaluating a specific property — or want to know what one you already own would rent for — High Desert Property Management is headquartered here, and a rental analysis from us is free.',
      ),
    ]),
  },
  {
    title: 'Top Tips When Buying Investment Property in Redmond',
    slug: 'buying-investment-property-redmond',
    author: 'Craig Bramscher',
    publishedAt: '2026-02-26T09:00:00.000Z',
    tags: ['Redmond', 'Investing', 'Buying', 'Due Diligence'],
    seoTitle: 'Buying Investment Property in Redmond, OR: Top Tips | HDPM',
    seoDescription:
      'What to check before buying a Redmond, Oregon rental: neighborhood stability, Central Oregon weather exposure, conservative underwriting, Oregon landlord-tenant law, and management planning.',
    body: richText([
      paragraph(
        'Redmond has spent a decade turning into Central Oregon’s practical, livable alternative to Bend — expanding neighborhoods, a real employment base, and consistent long-term rental demand. But it isn’t a speculative market, and it doesn’t reward speculative buying. It rewards discipline. Here’s what we tell investors before they write a Redmond offer.',
      ),
      heading('Know What Kind of Market This Is'),
      paragraph(
        'Redmond’s rental demand is long-term residential, full stop. Tenants here are households looking for stable everyday housing near work and schools — not vacationers. That means neighborhood consistency, functional layouts, and durability beat trend-driven finishes every time, and it means your underwriting should assume twelve-month leases, not nightly rates.',
      ),
      heading('Buy Neighborhood Stability'),
      paragraph(
        'Not all of Redmond performs equally. Newer subdivisions on the growth edges and the established, consistently kept older neighborhoods both work — what doesn’t work is ignoring the block. Look at surrounding upkeep, infrastructure, and what nearby homes actually rent for. Rental stability follows neighborhood stability; so does appreciation.',
      ),
      heading('Underwrite the Weather'),
      paragraph(
        'Central Oregon is hard on buildings: hot, dry summers, cold winters, and freeze-thaw cycles that work on roofs, driveways, and foundations. Before you buy, evaluate the heating system, insulation, roof age, and exterior condition like they’re line items — because they will be. Efficient heat and good insulation aren’t upgrades here; they’re tenant-retention tools.',
      ),
      heading('Run Conservative Numbers'),
      paragraph(
        'The deal has to work at today’s realistic rent — not at a hoped-for increase. Budget property taxes, insurance, maintenance reserves, management, and honest vacancy assumptions. Redmond is a steady market, and steady markets punish optimistic pro formas quietly: one line item at a time.',
      ),
      heading('Inspect for Deferred Maintenance'),
      paragraph(
        'Plenty of Redmond’s housing stock is older, and older homes hide their expenses in roofs, plumbing, electrical panels, and siding. A detailed inspection before closing — and a repair budget set before you need it — is the difference between a cash-flowing rental and a project.',
      ),
      heading('Respect Oregon’s Rules'),
      paragraph(
        'Oregon regulates rent increases statewide, sets specific notice periods, and layers tenant protections that vary with property age. None of it is a reason not to invest — but all of it is a reason to have your lease, notices, and screening process exactly right. Compliance errors cost more than management fees.',
      ),
      heading('Decide How It Will Be Managed — Before You Close'),
      paragraph(
        'Self-managing means being available for maintenance calls, tenant communication, documentation, and law changes, indefinitely. If you live outside Central Oregon or simply value your time, decide on professional management as part of the purchase, not as a rescue later. A local manager can also tell you — before you buy — what the address will actually rent for and what it will cost to run. We do that analysis for investors at no charge.',
      ),
      heading('In a Nutshell'),
      paragraph(
        'Buy stability, underwrite conservatively, respect the climate and the law, and plan the management before the closing date. Do that in Redmond and you’re buying into one of Central Oregon’s most dependable long-term rental markets — with a local team at High Desert Property Management ready to run the numbers on any property you’re considering.',
      ),
    ]),
  },
]

async function seed() {
  console.log('📝 Porting Redmond posts...\n')
  const payload = await getPayload({ config })

  // Reuse an existing media doc as featured image where one fits
  const media = await payload.find({ collection: 'media', limit: 100, depth: 0 })
  const pick = (words: string[]) =>
    media.docs.find((m) => {
      const hay = `${(m as { alt?: string }).alt || ''} ${(m as { filename?: string }).filename || ''}`.toLowerCase()
      return words.some((w) => hay.includes(w))
    })
  const redmondImage = pick(['redmond', 'smith rock', 'high desert']) || pick(['central oregon', 'deschutes'])

  for (const post of POSTS) {
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    })

    const data: Record<string, unknown> = {
      title: post.title,
      slug: post.slug,
      status: 'published',
      publishedAt: post.publishedAt,
      author: post.author,
      tags: post.tags.map((tag) => ({ tag })),
      body: post.body,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    }
    if (redmondImage) data.featuredImage = redmondImage.id

    if (existing.docs[0]) {
      await payload.update({ collection: 'posts', id: existing.docs[0].id, data: data as never })
      console.log(`  ✏️  Updated /blog/${post.slug}`)
    } else {
      await payload.create({ collection: 'posts', data: data as never })
      console.log(`  ✨ Created /blog/${post.slug}`)
    }
  }

  console.log('\n✅ Done. Now flip the next.config redirects to /blog/<slug>.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
