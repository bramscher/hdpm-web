/**
 * Seed long-form contentSections for the market-area pages (P1-12/13/14 in
 * docs/hdpm-web-fix-brief.md). Structure ported from the live city pages,
 * copy rewritten with local specifics. Bend gets the deepest treatment;
 * smaller towns get shorter but distinct, non-templated content to avoid
 * thin doorway pages.
 *
 * Usage: npx tsx scripts/seed-market-content.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'

type Section = {
  heading: string
  paragraphs?: { paragraph: string }[]
  bullets?: { text: string }[]
}

const p = (...texts: string[]) => texts.map((t) => ({ paragraph: t }))
const b = (...texts: string[]) => texts.map((t) => ({ text: t }))

const CONTENT: Record<string, { sections: Section[]; seoTitle?: string; seoDescription?: string }> = {
  bend: {
    seoTitle: 'Bend Property Management Company | High Desert Property Management',
    seoDescription:
      'Full-service Bend property management: marketing, tenant screening, rent collection, maintenance, and Oregon compliance from a local Central Oregon team. Get a free rental analysis.',
    sections: [
      {
        heading: 'Let Us Manage Your Bend Rental Property',
        paragraphs: p(
          'Bend attracts new residents, investors, and long-term renters every year — and with that demand comes real competition among rental properties. Managing a rental here well takes local pricing knowledge, responsive systems, and a proactive approach to Oregon’s tenant regulations.',
          'High Desert Property Management serves owners throughout Bend and the surrounding Central Oregon communities from our Redmond office, twenty minutes up Highway 97. Whether you own a single-family home in NorthWest Crossing, a townhome near the Old Mill District, or a small portfolio spread across town, we tailor our management to your goals — and we treat your property like it’s our own.',
        ),
      },
      {
        heading: 'Strategic Marketing & Tenant Placement',
        paragraphs: p(
          'Vacancy is the biggest silent cost in rental ownership, and in a market as visible as Bend’s, pricing and presentation decide how long a home sits empty. We start every placement with a detailed rental analysis — comparing your home against currently listed and recently rented properties in its own neighborhood, not city-wide averages — to set a rent that’s competitive without leaving money on the table.',
          'From there we create professional listings with quality photography, syndicate them across the major rental platforms, respond to inquiries quickly, and coordinate showings. Qualified applicants move into a structured screening process; the goal is a tenant who pays on time, cares for the home, and stays.',
        ),
      },
      {
        heading: 'Comprehensive Tenant Screening',
        paragraphs: p(
          'Placing the right tenant is the single most important decision in the rental lifecycle. Every application we process gets a consistent, documented review: credit history, criminal background where permitted, employment and income verification, and rental history — including calls to previous landlords when appropriate.',
          'Our screening complies with federal, state, and local fair housing laws, and the consistency protects you: every applicant is evaluated against the same criteria, which reduces both risk and liability. Strong screening up front is why our portfolio sees fewer late payments, fewer lease violations, and very few evictions.',
        ),
      },
      {
        heading: 'Rent Collection & Financial Reporting',
        paragraphs: p(
          'Tenants pay online through their portal, with clear due dates and automatic reminders. Our team monitors payments daily and addresses delinquencies promptly and professionally, following Oregon’s notice requirements to the letter.',
          'As an owner you get transparent monthly statements through your own portal — income, expenses, and net distribution for each property — plus year-end reporting that makes tax preparation straightforward. You always know how your investment is performing without having to ask.',
        ),
      },
      {
        heading: 'Maintenance, Inspections & Vendor Network',
        paragraphs: p(
          'Bend’s high-desert climate is hard on homes: freeze-thaw cycles crack driveways and hose bibs, juniper and pine throw debris into gutters, and winter storms test every furnace. We coordinate maintenance through a network of trusted local vendors we’ve worked with for years, at rates that come from ongoing relationships rather than one-off service calls.',
          'Preventative care is the core of our approach — seasonal checks, documented move-in and move-out inspections, and periodic property visits that catch small issues before they become expensive ones. Tenants report maintenance 24/7 through their portal, and urgent issues get urgent responses.',
        ),
      },
      {
        heading: 'Lease Management & Oregon Legal Compliance',
        paragraphs: p(
          'Oregon has some of the most detailed landlord-tenant law in the country — statewide rent-increase limits, specific notice periods, strict security-deposit accounting, and tenant protections that change session by session. Getting it wrong is expensive.',
          'We prepare professionally drafted leases, manage renewals and rent adjustments within Oregon’s legal limits, serve required notices correctly, and document everything. When the legislature changes the rules — and it regularly does — our processes change with them, so your property stays compliant without you having to track Salem.',
        ),
      },
      {
        heading: 'Bend Neighborhoods We Know',
        paragraphs: p(
          'Rental pricing in Bend is a neighborhood game. The same three-bedroom home rents very differently in NorthWest Crossing than it does east of 27th Street, and knowing those lines is where local management earns its keep. Areas we actively manage in and price street by street include:',
        ),
        bullets: b(
          'NorthWest Crossing — master-planned westside living; strong demand from professionals and families, premium rents',
          'Old Mill District & Old Bend — walkable riverfront core; compact homes and townhomes with year-round demand',
          'Awbrey Butte — larger view homes; a smaller but high-value tenant pool',
          'Orchard District & Midtown — central, fast-improving corridors with strong value for tenants',
          'Southeast Bend — newer subdivisions with family demand and good school access',
          'Larkspur & the east side — Bend’s best rent-to-price ratios for investors',
        ),
      },
      {
        heading: 'Short-Term vs. Long-Term Rentals in Bend',
        paragraphs: p(
          'Bend regulates short-term rentals tightly: operating one requires a city permit, and in most residential zones new permits are subject to a buffer rule that keeps them from clustering — which means many properties simply can’t get one. Add seasonal swings, higher turnover costs, and lodging taxes, and the STR math is less attractive than it looks on a listing site.',
          'Long-term rentals offer what Bend’s fundamentals actually support: steady year-round demand from a growing population of healthcare, tech, tourism, and trades workers. If you’re weighing converting an STR to a long-term rental — or buying with rental income in mind — we’ll run the numbers for your specific property, free.',
        ),
      },
      {
        heading: 'Vacancy Reduction & Tenant Retention',
        paragraphs: p(
          'Every turnover costs you cleaning, repairs, marketing, and lost rent — often a five-figure hit on a Bend home once vacancy days are counted. Retention is the cheapest profit lever there is, and it comes from unglamorous consistency: prompt maintenance, clear communication, fair pricing at renewal.',
          'We start renewal conversations well before lease expiration and price renewals to keep good tenants rather than chase the last dollar. The result across our portfolio is longer tenancies, fewer vacancy gaps, and better total returns.',
        ),
      },
      {
        heading: 'How We Onboard Your Bend Property',
        paragraphs: p(
          'Switching to professional management — or to a better manager — should not be disruptive. Our onboarding is a defined process, and most Bend properties are fully transitioned within two weeks.',
        ),
        bullets: b(
          'Free rental analysis: we evaluate your property and give you a realistic rent range, a days-on-market expectation, and a condition punch list',
          'Management agreement: plain-language terms, no long-term lock-in — we keep your business by earning it',
          'Property intake: documented walkthrough with photos, keys, and vendor introductions; existing tenants and leases transfer seamlessly',
          'Make-ready guidance: we tell you which improvements actually move rent in your neighborhood, and which don’t pay back',
          'Go live: professional listing, showings, screening, and placement — with your owner portal active from day one',
        ),
      },
      {
        heading: 'Bend Owner FAQs',
        paragraphs: p(
          'How long will my Bend home take to rent? Priced correctly, most well-presented homes in our Bend portfolio lease in two to four weeks, with the westside and family-sized homes near good schools moving fastest. Overpricing is the number-one cause of long vacancies — it costs more than it earns, every time.',
          'What does management cost? Fees depend on the property and the level of service, and we’d rather walk you through them in a quick call than hide behind a number on a website. The rental analysis is free either way, and there’s no obligation.',
          'Can you take over mid-lease? Yes. We regularly take over properties with tenants in place — the lease transfers, tenants get portal access and a new maintenance contact, and owners usually hear from their tenants that things got better.',
          'Do I have to allow pets? Oregon law caps pet deposits and requires care with service and companion animals; beyond the legal baseline it’s your call. We’ll show you the data — pet-friendly listings in Bend rent faster and to a much deeper applicant pool — and set screening and rent terms that protect the property.',
        ),
      },
      {
        heading: 'About Bend, Oregon',
        paragraphs: p(
          'Bend sits on the Deschutes River at the eastern foot of the Cascades — a city of roughly 100,000 that has grown from a mill town into Central Oregon’s economic center. Healthcare, technology, outdoor-industry companies, construction, and tourism give it a diverse employment base, and the lifestyle — Mt. Bachelor twenty minutes west, hundreds of miles of trails, the Old Mill and downtown cores — keeps drawing new residents.',
          'That steady in-migration is what makes Bend rentals work: demand renews itself every year. Median rents in our management area typically run around the low-$2,000s for a single-family home, with the westside commanding meaningful premiums. If you own here, or you’re considering buying here, a free rental analysis will tell you exactly where your property fits.',
        ),
      },
    ],
  },

  redmond: {
    seoTitle: 'Redmond Property Management | High Desert Property Management',
    seoDescription:
      'Redmond, Oregon property management from the team headquartered here. Marketing, screening, rent collection, maintenance, and compliance for Redmond rental owners. Free rental analysis.',
    sections: [
      {
        heading: 'Property Management From Redmond, For Redmond',
        paragraphs: p(
          'Our office is at 1515 SW Reindeer Avenue — we don’t manage Redmond from Bend or from a call center, we manage it from inside it. That matters when a pipe bursts on a February night, when a showing needs to happen tomorrow, and when a rent price needs to reflect what’s actually happening on the street, not a metro-wide average.',
          'We manage single-family homes, duplexes, and small multifamily buildings across Redmond, from the canyon rim neighborhoods to the new subdivisions on the city’s expanding edges.',
        ),
      },
      {
        heading: 'Why Redmond Rentals Perform',
        paragraphs: p(
          'Redmond has quietly become one of Oregon’s fastest-growing cities. It offers what Bend increasingly can’t: attainable housing. Families and workers priced out of Bend land here — fifteen minutes up the highway from Bend employers — and that keeps rental demand consistently strong at price points below Bend’s.',
          'For investors, that translates into better rent-to-purchase-price ratios than the westside of Bend, with tenants who tend to stay longer. Roberts Field (RDM), Central Oregon’s commercial airport, plus healthcare, manufacturing, and a revitalized downtown give the local economy its own legs.',
        ),
      },
      {
        heading: 'Full-Service Management, Local Standards',
        paragraphs: p(
          'Everything we do in Bend we do in Redmond, with the same systems: neighborhood-level rental analysis and professional marketing, structured fair-housing-compliant tenant screening, online rent collection with owner statements in your portal, maintenance through vendors we know personally, and leases kept current with Oregon’s evolving landlord-tenant law.',
          'Because our maintenance techs and inspectors are based here, Redmond properties get the fastest response times in our portfolio.',
        ),
      },
      {
        heading: 'Redmond Areas We Manage',
        bullets: b(
          'Downtown & the historic core — character homes, walkability, steady demand',
          'SW Redmond & the canyon rim — established neighborhoods with mature landscaping',
          'NW Redmond — newer subdivisions popular with relocating families',
          'Eagle Crest corridor — resort-adjacent homes west of town',
          'South Redmond — growth corridor near the airport and industrial employers',
          'Terrebonne & the north end — small-acreage and rural-residential rentals',
        ),
      },
      {
        heading: 'For Redmond Investors',
        paragraphs: p(
          'If you’re evaluating an investment purchase in Redmond, talk to us before you write the offer. We’ll tell you what a specific address will actually rent for, what tenants in that neighborhood expect, and what maintenance surprises to budget for — the kind of ground truth that doesn’t show up in a listing pro forma.',
          'And if you already own here, a free rental analysis will show you whether your current rent, lease terms, and property condition are leaving return on the table.',
        ),
      },
      {
        heading: 'Redmond Owner FAQs',
        paragraphs: p(
          'How fast do Redmond homes rent? Correctly priced single-family homes in Redmond typically lease inside a month, and often much faster — the applicant pool here is deep because Redmond is where Central Oregon’s workforce can actually afford to live.',
          'What will my property rent for? That depends on the street, the condition, and the season, which is exactly why we do the analysis property by property rather than quoting averages. It’s free, and it comes with a days-on-market estimate and a list of anything worth fixing before listing.',
          'Do you handle problem tenancies you inherit? Yes. If you’re coming to us with a tenancy that’s already off the rails — late payments, lease violations, deferred maintenance — we triage it first: document the current state, re-establish expectations in writing, and follow Oregon’s notice process where needed.',
          'What does management cost? We talk through fees directly with every owner — a short call, straight answers, no obligation. Every property and service level is a little different, and we’d rather quote yours accurately than publish a number that fits nobody.',
        ),
      },
      {
        heading: 'About Redmond, Oregon',
        paragraphs: p(
          'Redmond sits at the geographic center of Central Oregon, where Highways 97 and 126 cross — everything in the region is a short drive. The city has more than doubled in size since the early 2000s and continues to add households every year, supported by the airport, healthcare expansion, manufacturing, and its role as the region’s crossroads.',
          'High Desert Property Management has been part of this community since 2011. It’s our home market, and no one manages it with more local depth.',
        ),
      },
    ],
  },

  sisters: {
    seoTitle: 'Sisters Property Management | High Desert Property Management',
    seoDescription:
      'Property management in Sisters, Oregon: local marketing, tenant screening, maintenance, and Oregon compliance for a small, supply-constrained rental market. Free rental analysis.',
    sections: [
      {
        heading: 'Managing Rentals in Sisters',
        paragraphs: p(
          'Sisters is a small market with unusual dynamics: a strict western-themed design code, tight development boundaries, and a steady stream of people who want to live at the foot of the Three Sisters. Housing supply grows slowly here, which keeps quality long-term rentals scarce — and scarce means valuable, if the property is managed well.',
          'We’ve managed homes in Sisters and the surrounding area for years, from in-town cottages to homes on acreage toward Camp Sherman and Black Butte. It’s a market where reputation travels fast, and ours is good.',
        ),
      },
      {
        heading: 'What We Handle For You',
        paragraphs: p(
          'Our Sisters owners get the full service: neighborhood-honest rental pricing, professional listings, structured fair-housing-compliant screening, online rent collection with monthly owner statements, coordinated maintenance, and leases that keep up with Oregon’s landlord-tenant law.',
          'Distance is never an issue — our team is twenty-five minutes away in Redmond, and our vendors already work in Sisters every week.',
        ),
      },
      {
        heading: 'The Sisters Rental Market',
        paragraphs: p(
          'Demand comes from a mix you don’t see elsewhere in Central Oregon: teachers and staff for the well-regarded school district, employees of the town’s galleries, restaurants, and outdoor businesses, retirees waiting out a home build, and remote workers who chose the town for its trails and its quiet.',
          'Single-family homes dominate the rental stock, and well-kept properties rarely sit. Tenants who land a good rental in Sisters tend to hold onto it, which means low turnover for owners — the best kind of return.',
        ),
      },
      {
        heading: 'Short-Term Rental Reality Check',
        paragraphs: p(
          'Sisters’ tourism economy makes short-term renting tempting, but the city limits vacation rentals through permitting and concentration rules, and the seasonal swings are real. For many owners, a quality long-term tenant produces comparable net income with far less friction. If you’re weighing the two, we’ll run your property’s numbers both ways — honestly.',
        ),
      },
      {
        heading: 'Maintenance in the Pines',
        paragraphs: p(
          'Owning rental property in Sisters means owning trees — and the maintenance profile that comes with them. Ponderosa needles load roofs and gutters every fall, defensible-space expectations around wildfire are real and growing, and homes toward Camp Sherman and Black Butte often add wells, septic systems, and propane to the checklist.',
          'Our maintenance program is built for it: seasonal gutter and roof checks, defensible-space awareness on acreage properties, winterization before the freeze, and vendors who actually service the Sisters area rather than charging a trip fee to think about it. Documented inspections at move-in, move-out, and mid-lease keep owners ahead of the deferred-maintenance curve that quietly eats rural rentals.',
        ),
      },
      {
        heading: 'Sisters Owner FAQs',
        paragraphs: p(
          'How quickly will my Sisters home rent? Inventory is so tight that well-presented homes often lease in days, not weeks. The constraint here is supply, not demand — which also means pricing power belongs to owners who keep their properties in good shape.',
          'Can you manage my property if I live out of state? Most of our Sisters owners aren’t local. Between the owner portal, monthly statements, photo-documented inspections, and a team twenty-five minutes away, distance stops being a factor.',
          'What about renting to seasonal workers or month-to-month? We generally steer Sisters owners toward standard twelve-month leases — the tenant pool supports it, and stability is where the returns are. Where a shorter term genuinely fits, we paper it properly under Oregon law.',
        ),
      },
      {
        heading: 'About Sisters, Oregon',
        paragraphs: p(
          'Sisters sits where the pines meet the high desert, twenty miles northwest of Bend. The town’s events — the Sisters Rodeo, the folk festival, the quilt show — draw visitors from across the country, but it’s the schools, the scenery, and the pace that make people stay.',
          'For rental owners, that combination means a small but durable tenant base and property values that have held up decade after decade. A free rental analysis will show you what your Sisters property can do.',
        ),
      },
    ],
  },

  prineville: {
    seoTitle: 'Prineville Property Management | High Desert Property Management',
    seoDescription:
      'Prineville and Crook County property management: local pricing, screening, maintenance, and compliance from a Central Oregon team. Free rental analysis for Prineville owners.',
    sections: [
      {
        heading: 'Managing Rentals in Prineville',
        paragraphs: p(
          'Prineville is Central Oregon’s value market — and one of its most interesting. The arrival of major data-center campuses brought steady payrolls and construction activity to Crook County, while housing prices stayed well below Bend and Redmond. For rental owners, that combination produces some of the strongest cash-flow fundamentals in the region.',
          'We manage single-family homes, duplexes, and small multifamily properties across Prineville, from the historic core near the courthouse to the newer developments on the west side.',
        ),
      },
      {
        heading: 'Full-Service, Locally Priced',
        paragraphs: p(
          'Prineville rents, deposits, and tenant expectations are their own thing — pricing a Prineville rental off Redmond comps loses tenants, and pricing it off fear leaves money behind. We price from actual Crook County activity.',
          'Beyond pricing, owners get our full system: professional marketing, consistent fair-housing-compliant screening, online rent collection and owner statements, vendor-coordinated maintenance with documented inspections, and Oregon-compliant leases and notices.',
        ),
      },
      {
        heading: 'The Prineville Tenant Base',
        paragraphs: p(
          'Demand comes from data-center and construction workers, employees of the mills and manufacturers that anchor the county, healthcare staff, and families who chose Prineville for affordability and small-town schools. It’s a practical tenant base that values a well-maintained home and a responsive manager.',
          'Turnover in our Prineville portfolio is low — when tenants find a good home at a fair price here, they stay.',
        ),
      },
      {
        heading: 'For Crook County Investors',
        paragraphs: p(
          'If you’re considering buying rental property in Prineville, we’re happy to be your ground truth before you commit: realistic rent for the specific address, realistic make-ready costs, and how quickly it will actually lease. Owners who already hold property here can get the same clarity with a free rental analysis.',
        ),
      },
      {
        heading: 'High-Desert Maintenance, Done Right',
        paragraphs: p(
          'Crook County homes work hard: hot dry summers, cold winters, wind, and a housing stock that ranges from turn-of-the-century houses near downtown to brand-new builds on the west side. The maintenance answer isn’t one-size-fits-all, and neither is our vendor list — we match the trade to the house, whether that’s an older home’s galvanized plumbing or a new build still under warranty.',
          'Every property gets documented move-in and move-out inspections plus periodic visits in between, and tenants report issues through the portal around the clock. Small problems get fixed while they’re still small — that’s the whole game in a value market, where deferred maintenance erodes exactly the affordability advantage you bought.',
        ),
      },
      {
        heading: 'Prineville Owner FAQs',
        paragraphs: p(
          'What do Prineville homes rent for? Meaningfully less than Bend or Redmond in absolute dollars — and often meaningfully more as a percentage of what you paid for the property. That ratio is why investors keep looking east. We’ll give you the exact number for your address with a free rental analysis.',
          'Is demand really stable? Yes. The data-center campuses, the county seat’s public employers, healthcare, and the mills give Prineville a payroll base that doesn’t swing with the tourism season. Our Prineville vacancies are consistently among the shortest in the portfolio.',
          'Do you manage older homes? Constantly — much of Prineville’s charm and its rental stock is pre-1980. We know what to inspect for, what to budget for, and which upgrades actually raise rent versus just raising costs.',
        ),
      },
      {
        heading: 'About Prineville, Oregon',
        paragraphs: p(
          'Prineville is Central Oregon’s oldest town and the seat of Crook County, set in the Crooked River valley east of Redmond. Ranching and timber built it; data centers, recreation, and affordability are growing it. The Ochoco Mountains and reservoir country east of town make it a base for hunters, anglers, and riders.',
          'For rental owners, Prineville offers what the pricier markets can’t: entry prices that let the rent do the work. We’d love to show you the numbers.',
        ),
      },
    ],
  },

  culver: {
    sections: [
      {
        heading: 'Rental Management in Culver',
        paragraphs: p(
          'Culver is a small farming community between Redmond and Madras, minutes from the Cove Palisades and Lake Billy Chinook. Its rental stock is modest — single-family homes and a handful of small multiplexes — but demand is dependable, driven by agricultural employers, families in the Culver school district, and workers commuting to Madras and Redmond.',
          'We manage Culver properties with the same systems as the rest of our portfolio: honest local pricing, careful screening, online rent collection, and maintenance handled by vendors who already work the Highway 97 corridor. Small markets punish absentee management; our team is twenty minutes away.',
        ),
      },
      {
        heading: 'Who Rents in Culver',
        paragraphs: p(
          'Tenants here are long-stayers: farm and agricultural-services employees, school district staff, and households that want small-town life at a price Central Oregon’s bigger towns no longer offer. Turnover is among the lowest in our portfolio, which is exactly what a rental owner wants.',
        ),
      },
    ],
  },

  metolius: {
    sections: [
      {
        heading: 'Rental Management in Metolius',
        paragraphs: p(
          'Metolius is a quiet Jefferson County town just southwest of Madras — a few hundred households, a strong sense of community, and rents that make it one of the most affordable places to live in Central Oregon. Rental demand comes from Madras-area employers, agricultural operations, and families in the 509-J school district.',
          'We bring full-service management to a town where most rentals have historically been self-managed: professional marketing, consistent screening, online payments, documented inspections, and Oregon-compliant leases. For owners, that usually means fewer vacancies and fewer surprises than going it alone.',
        ),
      },
      {
        heading: 'Owning Rental Property in Metolius',
        paragraphs: p(
          'Entry prices in Metolius are low by regional standards, and solid homes rent quickly to a stable, practical tenant base. If you own here — or you’re considering it — a free rental analysis will tell you what the market will actually pay.',
        ),
      },
    ],
  },

  madras: {
    sections: [
      {
        heading: 'Rental Management in Madras',
        paragraphs: p(
          'Madras is the seat of Jefferson County and the northern anchor of Central Oregon’s Highway 97 corridor. Its economy runs on agriculture, food processing, aviation at the Madras airport, and a growing bedroom-community role for workers commuting toward Redmond. Housing remains far more affordable than the region’s southern cities, and the rental market reflects it: steady demand, practical tenants, strong occupancy.',
          'We manage single-family homes and small multifamily properties across Madras with our full system — local pricing, fair-housing-compliant screening, online rent collection with owner statements, coordinated maintenance, and leases kept current with Oregon law.',
        ),
      },
      {
        heading: 'The Madras Market',
        paragraphs: p(
          'Madras tenants stay when the home is maintained and the management is responsive — and in a county where good rentals are scarce, a professionally managed property earns a reputation quickly. Views of the full Cascade lineup, Lake Billy Chinook twenty minutes away, and genuine affordability keep drawing households north.',
          'If you own rental property in Madras or are weighing a purchase, our free rental analysis will show you the realistic numbers for your specific address.',
        ),
      },
    ],
  },
}

async function seed() {
  console.log('🏙  Seeding market-area content sections...\n')
  const payload = await getPayload({ config })

  for (const [slug, content] of Object.entries(CONTENT)) {
    const existing = await payload.find({
      collection: 'market-areas',
      where: { slug: { equals: slug } },
      limit: 1,
    })
    const doc = existing.docs[0]
    if (!doc) {
      console.log(`  ⚠️  /market-areas/${slug} not found — skipped`)
      continue
    }
    const words = content.sections
      .flatMap((s) => [
        s.heading,
        ...(s.paragraphs?.map((x) => x.paragraph) || []),
        ...(s.bullets?.map((x) => x.text) || []),
      ])
      .join(' ')
      .split(/\s+/).length
    await payload.update({
      collection: 'market-areas',
      id: doc.id,
      data: {
        contentSections: content.sections,
        ...(content.seoTitle ? { seoTitle: content.seoTitle } : {}),
        ...(content.seoDescription ? { seoDescription: content.seoDescription } : {}),
      } as never,
    })
    console.log(`  ✏️  ${slug}: ${content.sections.length} sections, ~${words} words`)
  }

  console.log('\n✅ Done.')
  process.exit(0)
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
