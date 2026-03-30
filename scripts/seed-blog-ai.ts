/**
 * Seed script for HDPM AI & Technology blog posts.
 *
 * Usage:
 *   npx tsx scripts/seed-blog-ai.ts
 */

import 'dotenv/config'
import { getPayload } from 'payload'
import config from '../src/payload.config'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Lexical helpers ────────────────────────────────────────────────
function heading(text: string, tag: 'h2' | 'h3' = 'h2') {
  return {
    type: 'heading',
    tag,
    children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
  }
}

function paragraph(text: string) {
  return {
    type: 'paragraph',
    children: [{ type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
    direction: 'ltr',
    format: '',
    indent: 0,
    version: 1,
    textFormat: 0,
    textStyle: '',
  }
}

function richText(blocks: ReturnType<typeof heading | typeof paragraph>[]) {
  return {
    root: {
      type: 'root',
      children: blocks,
      direction: 'ltr',
      format: '',
      indent: 0,
      version: 1,
    },
  }
}

// ─── Image definitions (Wikimedia Commons — tech & Central Oregon) ──
const IMAGES: { id: string; url: string; alt: string; caption: string }[] = [
  {
    id: 'ai-maintenance-triage',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Old_Mill_District%2C_Bend%2C_OR_2009.jpg/1920px-Old_Mill_District%2C_Bend%2C_OR_2009.jpg',
    alt: 'The Old Mill District in Bend, Oregon — HDPM manages properties across Central Oregon with AI-powered maintenance',
    caption: 'Old Mill District, Bend — Wikimedia Commons',
  },
  {
    id: 'ai-showings',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Drake_Park%2C_Mirror_Pond%2C_Bend_-_DPLA_-_7ba59f3f1851b41d6ff024508a4cccea.jpg/1920px-Drake_Park%2C_Mirror_Pond%2C_Bend_-_DPLA_-_7ba59f3f1851b41d6ff024508a4cccea.jpg',
    alt: 'Drake Park in downtown Bend, Oregon where HDPM uses AI to schedule rental showings around the clock',
    caption: 'Drake Park, Bend — Wikimedia Commons',
  },
  {
    id: 'ai-self-tours',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Smith_Rock_State_Park_29385739846.jpg/1920px-Smith_Rock_State_Park_29385739846.jpg',
    alt: 'Smith Rock State Park near Redmond, Oregon — HDPM serves the entire Central Oregon rental market',
    caption: 'Smith Rock State Park — Wikimedia Commons',
  },
  {
    id: 'ai-after-hours',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mt._Bachelor%2C_Oregon%2C_early_morning.jpg/1920px-Mt._Bachelor%2C_Oregon%2C_early_morning.jpg',
    alt: 'Mt. Bachelor at dawn — like the mountain, HDPM AI support never sleeps',
    caption: 'Mt. Bachelor, Oregon — Wikimedia Commons',
  },
  {
    id: 'ai-owner-reporting',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg/1920px-View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg',
    alt: 'South Sister and Broken Top from the Cascade Lakes Scenic Byway in Central Oregon',
    caption: 'Cascade Lakes Scenic Byway — Wikimedia Commons',
  },
  {
    id: 'ai-tenant-experience',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG/1920px-Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG',
    alt: 'Downtown Sisters, Oregon — one of the communities HDPM serves with technology-forward property management',
    caption: 'Downtown Sisters, Oregon — Wikimedia Commons',
  },
  {
    id: 'ai-smart-home',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Sparks_Lake%2C_South_Sister%2C_Oregon.jpg/1920px-Sparks_Lake%2C_South_Sister%2C_Oregon.jpg',
    alt: 'Sparks Lake with South Sister in the Central Oregon Cascades',
    caption: 'Sparks Lake, Oregon — Wikimedia Commons',
  },
  {
    id: 'ai-predictive',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Deschutes_Wild_and_Scenic_River%2C_Oregon_%2836486230902%29.jpg/1920px-Deschutes_Wild_and_Scenic_River%2C_Oregon_%2836486230902%29.jpg',
    alt: 'Waterfall on the Deschutes Wild and Scenic River in Central Oregon',
    caption: 'Deschutes River, Oregon — Wikimedia Commons',
  },
  {
    id: 'ai-innovation-leader',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg/1920px-Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg',
    alt: 'The Three Sisters mountains reflected in Mirror Lake, Central Oregon',
    caption: 'Three Sisters, Oregon — Wikimedia Commons',
  },
  {
    id: 'ai-future-pm',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Central_Oregon_landscape.jpg/1920px-Central_Oregon_landscape.jpg',
    alt: 'Wide open Central Oregon landscape — the future of property management is here',
    caption: 'Central Oregon landscape — Wikimedia Commons',
  },
]

// ─── Download image ─────────────────────────────────────────────────
async function downloadImage(img: (typeof IMAGES)[number]): Promise<string> {
  const tmpDir = path.join(__dirname, '../tmp-images')
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true })

  const filePath = path.join(tmpDir, `${img.id}.jpg`)
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${img.id}.jpg (cached)`)
    return filePath
  }

  console.log(`  ↓ Downloading ${img.id}...`)
  const res = await fetch(img.url)
  if (!res.ok) throw new Error(`Failed to download image for ${img.id}: ${res.status}`)
  const buffer = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(filePath, buffer)
  console.log(`  ✓ ${img.id}.jpg`)
  return filePath
}

// ─── Category ───────────────────────────────────────────────────────
const AI_CATEGORY = {
  name: 'Technology & Innovation',
  slug: 'technology-innovation',
  description: 'How HDPM uses AI and technology to deliver better outcomes for property owners and tenants in Central Oregon',
}

// ─── Blog post content ──────────────────────────────────────────────
interface BlogPostData {
  title: string
  slug: string
  author: string
  publishedAt: string
  categorySlug: string
  tags: string[]
  imageIndex: number
  seoTitle: string
  seoDescription: string
  body: ReturnType<typeof richText>
}

const POSTS: BlogPostData[] = [
  {
    title: 'Maintenance Doesn\'t Stop at 5 PM: How AI Keeps Your Rental Protected 24/7',
    slug: 'ai-maintenance-triage-24-7-rental-protection',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-28T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'Maintenance', 'Property Management', '24/7 Support'],
    imageIndex: 0,
    seoTitle: 'AI-Powered 24/7 Maintenance Triage for Rentals | HDPM',
    seoDescription: 'Learn how High Desert Property Management uses AI to triage maintenance requests around the clock — not just during business hours. Faster response, fewer emergencies.',
    body: richText([
      paragraph('A pipe bursts at 11 PM on a Saturday night. A furnace dies during a January cold snap at 3 AM. A smoke detector starts chirping at midnight and your tenant isn\'t sure if it\'s a real emergency. In traditional property management, these situations wait until Monday morning — or get routed to a generic answering service that can\'t do much beyond take a message.'),
      paragraph('At High Desert Property Management, we believe maintenance doesn\'t operate on a 9-to-5 schedule, and neither should the response. That\'s why we\'ve deployed AI-powered maintenance triage that works around the clock, every day of the year.'),
      heading('How AI Maintenance Triage Works'),
      paragraph('When a tenant submits a maintenance request — whether it\'s 2 PM or 2 AM — our AI system immediately evaluates the issue. It asks targeted follow-up questions to understand the severity: Is there active water flowing? Is the unit habitable? Is there a safety risk? Based on the answers, it categorizes the request as emergency, urgent, or routine.'),
      paragraph('Emergency issues like active leaks, gas smells, or no heat in freezing temperatures trigger an immediate dispatch to our on-call maintenance team. The AI has already gathered the critical details — unit location, nature of the problem, tenant contact information — so the technician arrives informed and prepared, not starting from scratch.'),
      heading('Why This Matters in Central Oregon'),
      paragraph('Central Oregon\'s climate makes after-hours maintenance response critical. When temperatures drop below zero in Bend, Redmond, or Sisters, a broken furnace isn\'t an inconvenience — it\'s an emergency that can lead to frozen pipes and thousands of dollars in damage within hours. Our AI triage system understands this context. It factors in current weather conditions and property-specific details to make smarter urgency decisions.'),
      paragraph('During summer wildfire season, the calculus changes again. Electrical issues or unusual smells take on heightened urgency. The AI adapts its triage logic based on seasonal risk factors specific to our region.'),
      heading('What Tenants Experience'),
      paragraph('Tenants interact with our AI through a simple chat interface — no phone trees, no hold music, no waiting until morning. They describe the problem in plain language, answer a few clarifying questions, and receive an immediate response: either a confirmation that emergency service has been dispatched, a scheduled time for urgent repair, or a clear timeline for routine work.'),
      paragraph('Every interaction is logged and visible to our property management team. When we arrive at the office Monday morning, we have a complete picture of everything that happened over the weekend — not a stack of voicemails to sort through.'),
      heading('The Owner Benefit'),
      paragraph('For property owners, AI triage reduces emergency costs by catching small problems before they escalate. A slow drip reported at midnight and intelligently triaged can prevent a ceiling collapse by morning. The system also prevents unnecessary emergency dispatches — that chirping smoke detector probably just needs a battery, and the AI knows how to walk a tenant through that fix in real time.'),
      paragraph('The data speaks for itself: since implementing AI triage, our average emergency response time has improved significantly, and our rate of preventable escalations has dropped. Your property is better protected at 2 AM than it was under the old model at 2 PM.'),
      heading('This Is the New Standard'),
      paragraph('Property management has operated on business hours for decades. AI changes that equation entirely. At HDPM, we\'re not waiting for the industry to catch up — we\'re setting the pace for Central Oregon. If your current property manager still relies on an answering service after hours, it\'s worth asking what that gap in coverage is really costing you.'),
    ]),
  },
  {
    title: 'AI-Powered Showing Scheduling: How We Fill Vacancies Faster in Central Oregon',
    slug: 'ai-powered-showing-scheduling-fill-vacancies-faster',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-26T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'Showings', 'Vacancy', 'Leasing'],
    imageIndex: 1,
    seoTitle: 'AI Showing Scheduling for Faster Vacancy Fills | HDPM',
    seoDescription: 'HDPM uses AI to schedule property showings instantly — no phone tag, no delays. See how we fill Central Oregon rentals faster with smart automation.',
    body: richText([
      paragraph('Every day a rental property sits vacant is money lost — roughly $65 to $100 per day for a typical Central Oregon rental. The traditional showing process is one of the biggest contributors to extended vacancy: a prospective tenant sees a listing, calls or emails, waits for a callback, plays phone tag for two days, and finally schedules a showing for next week. By then, they\'ve already signed a lease somewhere else.'),
      paragraph('At HDPM, we\'ve eliminated that friction with AI-powered showing scheduling that responds to inquiries instantly and books showings in real time.'),
      heading('Instant Response, Any Time of Day'),
      paragraph('When a prospective tenant finds one of our listings on Zillow, Apartments.com, or our website, they can immediately interact with our AI leasing assistant. The assistant answers questions about the property — rent, pet policy, move-in costs, square footage, parking — and offers available showing times on the spot.'),
      paragraph('This happens at 10 AM on a Tuesday or 11 PM on a Sunday. The AI doesn\'t take lunch breaks and doesn\'t have a queue of other callers. The response is immediate, informed, and personalized to the specific property the prospect is asking about.'),
      heading('Smart Scheduling That Maximizes Efficiency'),
      paragraph('Our AI doesn\'t just offer random time slots. It clusters showings intelligently — grouping multiple prospects into back-to-back windows, factoring in travel time between properties, and prioritizing time slots that historically convert at higher rates. Weekend afternoon showings in Bend convert differently than Tuesday morning showings in Redmond. The AI knows this and optimizes accordingly.'),
      paragraph('The system also pre-qualifies prospects during the scheduling interaction. It asks about move-in timeline, income range, and pet situation — not to screen anyone out, but to ensure the showing is a productive use of everyone\'s time. A prospect looking for a studio when they\'re booking a four-bedroom showing gets redirected to better-fit listings.'),
      heading('The Results'),
      paragraph('Since implementing AI showing scheduling, our average inquiry-to-showing time has compressed dramatically. Prospects who previously waited days for a callback now book within minutes of their first inquiry. Our showing-to-application conversion rate has improved because prospects are better matched and more engaged when they arrive.'),
      paragraph('For property owners, this means shorter vacancy periods. In a market like Bend where rental demand is strong but competition among listings is real, being the first property to get a qualified prospect through the door is a significant advantage.'),
      heading('What the Prospect Sees'),
      paragraph('From the tenant\'s perspective, the experience feels modern and respectful of their time. They ask a question, get an accurate answer immediately, and book a showing without a single phone call. After booking, they receive a confirmation with the address, parking instructions, what to bring, and a reminder the day before.'),
      paragraph('If they need to reschedule, the AI handles that too — no awkward calls or unreturned messages. It\'s the kind of leasing experience people expect in 2026, and it\'s what HDPM delivers across every property we manage.'),
      heading('Competitive Advantage for Owners'),
      paragraph('If you own rental property in Central Oregon, your leasing process is either winning prospects or losing them. Every hour of delay between inquiry and showing is an opportunity for a competitor\'s listing to close the deal. AI showing scheduling isn\'t a nice-to-have — it\'s the difference between a two-week vacancy and a six-week one. At HDPM, we treat technology as a revenue tool, not a cost center.'),
    ]),
  },
  {
    title: 'Self-Guided Tours: How AI and Smart Access Are Changing Rental Showings',
    slug: 'ai-self-guided-tours-smart-access-rental-showings',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-24T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'Self-Guided Tours', 'Smart Locks', 'Leasing'],
    imageIndex: 2,
    seoTitle: 'AI Self-Guided Rental Tours in Central Oregon | HDPM',
    seoDescription: 'HDPM offers AI-managed self-guided tours for rental properties across Central Oregon. Tour on your schedule with smart access — no agent required.',
    body: richText([
      paragraph('The traditional rental showing model is broken for everyone involved. Tenants have to take time off work or rearrange their schedules to meet an agent during limited showing windows. Property managers spend hours driving between properties to unlock doors for 15-minute walkthroughs. And property owners pay for all that windshield time in their management fees.'),
      paragraph('At High Desert Property Management, we\'ve deployed AI-managed self-guided tours that let qualified prospects view properties on their own schedule — safely, securely, and efficiently.'),
      heading('How Self-Guided Tours Work'),
      paragraph('When a prospective tenant schedules a tour through our AI leasing assistant, the system verifies their identity and generates a unique, time-limited smart lock access code. The code works only during the scheduled window — typically a 30 to 60 minute block — and is tied to that specific prospect. The AI sends detailed instructions including the address, access code, parking, and what to look for during the tour.'),
      paragraph('The prospect arrives, enters the code, tours the property at their own pace, and leaves. No waiting for an agent. No rushed walkthrough because the next showing is in 15 minutes. They can open cabinets, check water pressure, measure rooms, and actually imagine living in the space.'),
      heading('Safety and Security Built In'),
      paragraph('Self-guided doesn\'t mean unsupervised. Every tour is logged — entry time, exit time, and the identity-verified prospect associated with each code. Smart lock systems record all access events. If a prospect doesn\'t exit within the scheduled window, our system sends an automated check-in. If anything seems off, our team is alerted immediately.'),
      paragraph('Prospects are pre-screened before receiving access codes. The AI verifies identity, confirms a valid reason for touring, and flags anything unusual. This isn\'t a lockbox on the door with a universal code — it\'s a controlled, technology-enabled experience that prioritizes both access and security.'),
      heading('Why This Works in Central Oregon'),
      paragraph('Central Oregon\'s geography makes self-guided tours especially valuable. Our managed properties span from Bend to Redmond to Sisters to Madras — a wide service area where driving between showings eats up hours. Self-guided tours eliminate the need for an agent to be physically present at every showing, which means we can offer more tour availability across more properties.'),
      paragraph('For tenants relocating to Central Oregon from Portland, the Bay Area, or Seattle — which is a significant portion of our applicant pool — self-guided tours let them view properties during a weekend visit without coordinating schedules across time zones.'),
      heading('Better Conversion Rates'),
      paragraph('Self-guided tours consistently convert at higher rates than agent-led showings. The reason is straightforward: prospects who tour at their own pace, without feeling rushed or observed, develop a stronger connection to the space. They spend more time, bring family members, and make more confident decisions.'),
      paragraph('We follow up every self-guided tour with an AI-powered check-in that asks about their experience, answers any remaining questions, and makes it easy to submit an application on the spot. The entire flow — from listing discovery to application — can happen in under 24 hours.'),
      heading('The Future of Leasing'),
      paragraph('Self-guided tours aren\'t a pandemic workaround that stuck around. They\'re a fundamentally better model for everyone — more convenient for tenants, more efficient for managers, and more profitable for owners. At HDPM, we\'ve invested in the smart access infrastructure and AI systems to make this work seamlessly across our portfolio. It\'s one of the reasons we fill vacancies faster than the Central Oregon market average.'),
    ]),
  },
  {
    title: 'Why Your Property Manager Should Never Be Off the Clock: AI After-Hours Support',
    slug: 'ai-after-hours-support-property-management',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-22T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'After-Hours', 'Tenant Support', 'Property Management'],
    imageIndex: 3,
    seoTitle: 'AI After-Hours Support for Property Management | HDPM',
    seoDescription: 'HDPM provides AI-powered after-hours support for tenants and owners. No answering services, no waiting until Monday — real help any time of day.',
    body: richText([
      paragraph('In the property management industry, "after hours" has traditionally meant one of two things: a generic answering service that takes a message, or nothing at all. Tenants call, get a recording, leave a message, and hope someone calls back in the morning. Owners with urgent questions about their property wait until business hours to get answers. The entire operation shuts down at 5 PM.'),
      paragraph('At HDPM, we\'ve fundamentally rethought this model. Our AI-powered after-hours support doesn\'t just take messages — it resolves issues, answers questions, and takes action, any time of day or night.'),
      heading('More Than an Answering Service'),
      paragraph('Traditional answering services are a bottleneck dressed up as a solution. A human operator answers the phone, writes down what the caller says, and sends an email that nobody reads until morning. There\'s no triage, no resolution, no follow-up. It\'s a message pad, not a support system.'),
      paragraph('Our AI assistant understands property management. When a tenant calls about a leaking faucet, the AI asks whether it\'s a drip or a flow, whether there\'s water damage, and whether they can access the shut-off valve. Based on the answers, it either dispatches emergency maintenance, walks the tenant through a temporary fix, or schedules a repair for the next business day — all in the same conversation.'),
      heading('Tenant Questions Answered Instantly'),
      paragraph('The majority of after-hours tenant contacts aren\'t emergencies. They\'re questions: When is rent due? What\'s my landlord\'s mailing address for renter\'s insurance? Can I have a guest stay for two weeks? Where do I pick up a package? Is the parking lot going to be plowed tomorrow?'),
      paragraph('These questions have straightforward answers, but under the old model, they required a business-hours callback. Our AI handles them instantly. It has access to lease details, property policies, community guidelines, and frequently asked questions specific to each property. The tenant gets their answer at 9 PM instead of waiting until 10 AM the next day.'),
      heading('Owner Access Around the Clock'),
      paragraph('Owners benefit from AI after-hours support too. Need to check on a recent maintenance expense? Wondering about the status of a lease renewal? Want to confirm when the next rent disbursement hits? Our system provides owners with real-time access to their property information without waiting for their property manager to be at their desk.'),
      heading('How This Reduces Costs'),
      paragraph('After-hours AI support is not just a service improvement — it\'s a cost reduction tool. By resolving routine questions and triaging maintenance intelligently, we reduce the volume of issues that require staff intervention during business hours. Our team starts each day focused on high-value work — complex repairs, lease negotiations, owner consultations — instead of returning a backlog of overnight messages.'),
      paragraph('For owners, this efficiency translates to better service at the same management fee. You\'re getting 24/7 coverage without paying a premium for overnight staffing.'),
      heading('Setting the Standard in Central Oregon'),
      paragraph('Most property management companies in Bend, Redmond, and Sisters still operate on business hours. Some have answering services. Very few have invested in AI systems that actually solve problems after the office closes. At HDPM, we see after-hours AI support as table stakes for modern property management — not a luxury feature. Your property doesn\'t take nights and weekends off, and neither should your property manager.'),
    ]),
  },
  {
    title: 'Real-Time Owner Reporting: How AI Gives You Instant Visibility Into Your Investment',
    slug: 'ai-real-time-owner-reporting-investment-visibility',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-20T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'Owner Portal', 'Reporting', 'Investment', 'Data'],
    imageIndex: 4,
    seoTitle: 'AI-Powered Real-Time Owner Reporting | HDPM',
    seoDescription: 'HDPM uses AI to deliver real-time financial and operational reporting to property owners. See your rental performance anytime, not just at month end.',
    body: richText([
      paragraph('Traditional property management reporting follows a familiar pattern: at the end of each month, you receive a PDF statement with last month\'s numbers. Rent collected, expenses paid, net disbursement. If you want more detail — why a repair cost what it did, how your vacancy compares to market averages, whether your rent is keeping pace with the neighborhood — you have to call your property manager and wait for answers.'),
      paragraph('At HDPM, we\'ve built AI-powered reporting that gives property owners real-time visibility into every aspect of their investment, on demand.'),
      heading('Your Property Dashboard'),
      paragraph('Every HDPM owner has access to a live dashboard that shows the current state of their portfolio. Not last month\'s state — today\'s. Rent payment status, active maintenance requests, upcoming lease expirations, market rent comparisons, and year-to-date financial performance. The data updates in real time as transactions occur and work orders close.'),
      paragraph('If your tenant paid rent this morning, you\'ll see it reflected in your dashboard by this afternoon. If a plumber completed a repair yesterday, the invoice, photos, and cost are already logged and visible. No waiting for month-end reconciliation.'),
      heading('AI-Generated Insights'),
      paragraph('Raw data is useful. Interpreted data is powerful. Our AI doesn\'t just display numbers — it analyzes them and surfaces insights. If your property\'s maintenance costs are trending above the portfolio average, the system flags it and identifies potential causes. If market rents in your neighborhood have shifted, you\'ll see a recommendation to adjust at renewal time, along with the projected revenue impact.'),
      paragraph('The AI also identifies patterns that humans miss in monthly statements. A gradual increase in water bills might indicate a hidden leak. Recurring maintenance at a specific property could signal deferred capital improvements. These insights arrive proactively, not after you think to ask.'),
      heading('Natural Language Queries'),
      paragraph('Have a question about your property? Ask it in plain English. Our AI owner assistant understands queries like "How much did I spend on maintenance at my Redmond property this year?" or "What\'s my average vacancy rate across all units?" or "When does the lease expire on my Bend duplex?" You get an instant, accurate answer without waiting for a callback.'),
      paragraph('This isn\'t a search engine — it\'s a property management assistant that knows your specific portfolio, your financial history, and your goals. It\'s available 24/7, and it never puts you on hold.'),
      heading('Tax-Ready Financials'),
      paragraph('At year-end, our system generates a comprehensive tax package for each property: income, categorized expenses, depreciation schedules, and 1099 forms. The AI ensures that every transaction is properly categorized throughout the year, so there\'s no last-minute scramble to sort expenses. Your CPA gets clean, organized data — not a shoebox of receipts.'),
      heading('Why This Matters for Central Oregon Investors'),
      paragraph('Many of our property owners live outside Central Oregon. They own rentals in Bend, Redmond, or Sisters but live in Portland, Seattle, or the Bay Area. Real-time AI reporting eliminates the distance problem. You have the same visibility into your Central Oregon rental that you\'d have if you were driving past it every day — actually, better visibility, because data doesn\'t lie and drive-bys don\'t show you the financials.'),
      paragraph('If you\'re managing your investment with monthly PDF statements and occasional phone calls, you\'re operating blind for 29 out of 30 days. HDPM\'s AI-powered reporting keeps the lights on all month long.'),
    ]),
  },
  {
    title: 'How AI Is Transforming the Tenant Experience in Central Oregon Rentals',
    slug: 'ai-transforming-tenant-experience-central-oregon',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-18T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'Tenant Experience', 'Communication', 'Central Oregon'],
    imageIndex: 5,
    seoTitle: 'AI-Powered Tenant Experience in Central Oregon | HDPM',
    seoDescription: 'From instant maintenance requests to smart communication, see how HDPM uses AI to create a better rental experience for Central Oregon tenants.',
    body: richText([
      paragraph('The bar for customer experience has been set by companies like Amazon, Apple, and Uber. Instant responses. Real-time tracking. Seamless digital interactions. Yet most rental tenants in Central Oregon are still calling an office number, leaving voicemails, and filling out paper forms. The gap between what tenants expect and what property managers deliver is enormous.'),
      paragraph('At HDPM, we\'re closing that gap with AI-powered systems that bring the tenant experience into 2026.'),
      heading('Instant Communication'),
      paragraph('When a tenant has a question, they shouldn\'t have to wait hours or days for an answer. Our AI tenant assistant is available 24/7 through text, chat, or phone. It handles the majority of routine interactions — lease questions, payment confirmations, community guidelines, maintenance scheduling — without any wait time.'),
      paragraph('The AI speaks conversationally, not like a robot reading a script. It understands context, remembers previous interactions, and escalates to a human team member when the situation requires it. Tenants tell us they often prefer the AI interaction because it\'s faster, more consistent, and available when they need it — not just during office hours.'),
      heading('Maintenance Without the Hassle'),
      paragraph('Submitting a maintenance request at HDPM is as simple as sending a text message. Describe the issue, snap a photo if helpful, and the AI takes it from there. It categorizes the request, sets the priority, schedules the repair, and keeps the tenant updated at every step — technician assigned, appointment confirmed, work completed, follow-up scheduled.'),
      paragraph('No more calling the office, explaining the problem to three different people, and wondering when someone will show up. The tenant has full visibility into the status of their request at all times.'),
      heading('Smart Move-In and Move-Out'),
      paragraph('Moving into a new rental is stressful. Our AI smooths the process by guiding tenants through every step: utility transfers, renter\'s insurance setup, move-in inspection documentation, key pickup or smart lock code delivery, and community orientation. Tenants receive a personalized checklist based on their specific property, with reminders and support along the way.'),
      paragraph('At move-out, the AI provides a clear timeline of required steps, cleaning standards, and inspection expectations. No surprises, no disputes — just a well-communicated process that respects everyone\'s time.'),
      heading('Personalized Communication'),
      paragraph('Not every tenant wants to communicate the same way. Some prefer text, some prefer email, some want phone calls. Our system tracks preferences and communicates accordingly. It also adjusts for timing — lease renewal reminders arrive at the optimal time based on the specific tenant\'s history and market conditions, not on a one-size-fits-all schedule.'),
      heading('Community Building'),
      paragraph('For multi-unit properties, our AI helps build community. It coordinates shared resource scheduling, communicates maintenance that affects common areas, and facilitates neighbor-to-neighbor information sharing when appropriate. A well-informed tenant community is a happier, longer-tenured one.'),
      heading('The HDPM Difference'),
      paragraph('We believe that great property management isn\'t just about maintaining buildings — it\'s about creating a living experience that tenants value. AI gives us the ability to deliver personalized, responsive, proactive service to every tenant across our portfolio, whether we manage their studio apartment in Bend or their single-family home in Madras. That consistency at scale is what technology enables and what tenants deserve.'),
    ]),
  },
  {
    title: 'Smart Home Technology in Rental Properties: What Owners Need to Know',
    slug: 'smart-home-technology-rental-properties-owners-guide',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-16T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['Smart Home', 'IoT', 'Property Owners', 'Technology'],
    imageIndex: 6,
    seoTitle: 'Smart Home Tech for Rental Properties | HDPM Blog',
    seoDescription: 'Should you install smart home tech in your Central Oregon rental? HDPM breaks down the ROI, risks, and recommendations for smart locks, thermostats, and sensors.',
    body: richText([
      paragraph('Smart home technology has moved from luxury novelty to practical infrastructure. Smart thermostats, keyless locks, leak sensors, and connected smoke detectors are no longer nice-to-haves — they\'re tools that protect your investment, reduce operating costs, and attract better tenants. But the rental property context is different from a homeowner\'s setup, and getting it right matters.'),
      paragraph('Here\'s what Central Oregon property owners need to know about deploying smart home tech in rentals.'),
      heading('Smart Locks: The Highest-ROI Upgrade'),
      paragraph('Smart locks are the single most impactful technology upgrade you can make to a rental property. They eliminate key management entirely — no more cutting keys, collecting keys, rekeying between tenants, or worrying about unreturned copies. When a tenant moves out, you change the code. When a maintenance tech needs access, you generate a time-limited code. When a prospective tenant wants a self-guided tour, the system handles it automatically.'),
      paragraph('At HDPM, smart locks are standard across our managed portfolio. The cost per unit is modest — typically $200 to $400 installed — and the savings in key management, rekeying, and showing efficiency pay for the investment within the first tenant turnover.'),
      heading('Smart Thermostats: Saving Money and Preventing Damage'),
      paragraph('In Central Oregon, heating is a significant expense. Smart thermostats like the Ecobee or Google Nest allow remote monitoring of interior temperatures. For property managers, the critical feature isn\'t energy savings — it\'s freeze protection. If a thermostat drops below 55°F during a January cold snap (whether the tenant is away or the system has failed), we get an immediate alert and can intervene before pipes freeze.'),
      paragraph('For owner-paid utility situations or vacant units between tenants, smart thermostats reduce energy waste by maintaining efficient temperatures without manual adjustment. The monthly energy savings typically cover the device cost within one winter season.'),
      heading('Leak Sensors: Early Warning Systems'),
      paragraph('Water damage is the most expensive maintenance event in property management. A small leak under a sink or behind a washing machine can cause thousands of dollars in damage before anyone notices. Smart leak sensors cost less than $30 each, run on batteries for years, and send instant alerts to both the tenant and management when moisture is detected.'),
      paragraph('We recommend placing leak sensors under kitchen sinks, behind toilets, near water heaters, and next to washing machine connections. The math is simple: $120 in sensors can prevent $5,000 to $15,000 in water damage repairs.'),
      heading('What to Avoid in Rentals'),
      paragraph('Not all smart home tech makes sense in a rental context. Smart cameras inside the unit are a privacy concern and generally inappropriate. Complex automation systems that require tenant training create more support issues than they solve. Voice assistants tied to a previous tenant\'s account create awkward handoff situations.'),
      paragraph('Stick to technology that is landlord-managed, tenant-transparent, and solves a real property management problem. The goal is to protect your asset and simplify operations, not to create a tech showcase.'),
      heading('The HDPM Approach'),
      paragraph('We evaluate smart home technology through a simple lens: does it reduce risk, reduce cost, or improve the tenant experience? If it doesn\'t clearly do at least one of those things, we skip it. Our recommended tech stack for Central Oregon rentals — smart locks, smart thermostats, and leak sensors — delivers measurable ROI and integrates seamlessly with our AI management systems.'),
      paragraph('If you\'re considering smart home upgrades for your rental property, we can provide a specific recommendation based on your property type, tenant profile, and budget. The right technology, properly implemented, is one of the best investments you can make in your rental portfolio.'),
    ]),
  },
  {
    title: 'Predictive Maintenance: How AI Prevents Problems Before They Start',
    slug: 'ai-predictive-maintenance-prevent-problems-before-they-start',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-14T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'Predictive Maintenance', 'Property Owners', 'Cost Savings'],
    imageIndex: 7,
    seoTitle: 'AI Predictive Maintenance for Rental Properties | HDPM',
    seoDescription: 'HDPM uses AI to predict maintenance issues before they become emergencies. Learn how data-driven property management saves Central Oregon owners money.',
    body: richText([
      paragraph('The traditional approach to rental property maintenance is reactive: something breaks, the tenant reports it, and you send someone to fix it. The problem with reactive maintenance is that by the time a system fails, the repair is expensive, the tenant is frustrated, and you may have secondary damage that multiplies the cost.'),
      paragraph('At HDPM, we\'re shifting to a predictive model — using AI and data to identify maintenance issues before they become emergencies.'),
      heading('How Predictive Maintenance Works'),
      paragraph('Every property in our portfolio generates data: maintenance history, inspection reports, equipment ages, seasonal patterns, and tenant-reported conditions. Our AI analyzes this data to identify properties and systems that are statistically likely to need attention in the near future.'),
      paragraph('A furnace that\'s 15 years old, was serviced last in 2023, and sits in a property with a history of heating complaints is a strong candidate for proactive replacement before it fails on the coldest night of the year. A roof that\'s approaching 20 years in Central Oregon\'s harsh UV and freeze-thaw environment gets flagged for inspection before the leaks start.'),
      heading('Pattern Recognition Across the Portfolio'),
      paragraph('One of the advantages of managing approximately 850 doors is the dataset. We see patterns that individual property owners can\'t. When a specific water heater model starts failing across multiple properties at the 8-year mark, our AI identifies the trend and recommends proactive replacement for every property with that model — before owners experience unexpected failures.'),
      paragraph('The same logic applies to appliances, HVAC systems, plumbing fixtures, and roofing materials. Our portfolio-wide data turns anecdotal experience into statistically informed decision-making.'),
      heading('Seasonal Predictive Alerts'),
      paragraph('Central Oregon\'s dramatic seasonal shifts create predictable maintenance patterns. The AI generates seasonal alerts customized to each property: winterization reminders in October, irrigation system activation in April, gutter cleaning before fall rains, and defensible space assessment before fire season. These aren\'t generic calendar reminders — they\'re prioritized based on the specific property\'s history, configuration, and risk profile.'),
      heading('The Financial Impact'),
      paragraph('Predictive maintenance is fundamentally a financial strategy. Emergency HVAC replacement costs 30 to 50% more than planned replacement — you\'re paying for after-hours labor, expedited parts, and temporary heating for the tenant. A proactive replacement happens on your schedule, with competitive bids, during normal business hours.'),
      paragraph('Across our portfolio, properties under predictive maintenance protocols experience fewer emergency work orders, lower average repair costs, and longer equipment lifespans. The AI pays for itself many times over by converting expensive surprises into planned line items.'),
      heading('What Owners See'),
      paragraph('When our AI identifies a predictive maintenance opportunity, owners receive a clear recommendation: what we\'ve identified, why it matters, what the proactive cost is, and what the likely emergency cost would be if deferred. The decision is always yours, but the information is complete and data-driven.'),
      paragraph('This is property management that thinks ahead instead of reacting. It\'s what AI makes possible, and it\'s how HDPM operates across every property in Central Oregon.'),
    ]),
  },
  {
    title: 'How HDPM Became Central Oregon\'s Most Innovative Property Management Company',
    slug: 'hdpm-central-oregon-most-innovative-property-management',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-12T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['Innovation', 'HDPM', 'Central Oregon', 'AI', 'Property Management'],
    imageIndex: 8,
    seoTitle: 'HDPM: Central Oregon\'s Most Innovative Property Manager | HDPM',
    seoDescription: 'How High Desert Property Management built the most technology-forward property management operation in Central Oregon. AI, automation, and a commitment to doing things differently.',
    body: richText([
      paragraph('Property management is one of the last industries to be transformed by technology. While other sectors have embraced AI, automation, and data-driven decision-making, most property management companies still operate with the same tools and processes they used a decade ago: spreadsheets, phone calls, carbon-copy forms, and business-hours-only service. That\'s not how we operate at HDPM.'),
      paragraph('Over the past several years, we\'ve systematically rebuilt our operation around technology — not for the sake of being trendy, but because better technology produces better outcomes for property owners and tenants.'),
      heading('Our Technology Investment Philosophy'),
      paragraph('Every technology decision at HDPM starts with one question: does this make a measurable difference for owners or tenants? We don\'t deploy technology for its own sake. We deploy it because AI maintenance triage reduces emergency costs. Because automated showing scheduling fills vacancies faster. Because predictive analytics prevents expensive surprises. Every tool earns its place.'),
      paragraph('This philosophy keeps us focused. We\'re not a tech company pretending to manage properties. We\'re a property management company that uses the best available technology to do our job better than anyone else in the market.'),
      heading('What We\'ve Built'),
      paragraph('Our technology stack includes AI-powered maintenance triage that operates 24/7, automated showing scheduling that responds to prospects instantly, self-guided tour infrastructure with smart access controls, real-time owner reporting dashboards, predictive maintenance analytics, and a tenant communication platform that eliminates wait times and voicemail.'),
      paragraph('None of these systems work in isolation. They\'re integrated — maintenance data feeds predictive models, showing data informs pricing recommendations, tenant communication patterns reveal satisfaction trends. The whole is greater than the sum of the parts.'),
      heading('The Central Oregon Advantage'),
      paragraph('Central Oregon is our home. We manage approximately 850 doors across Bend, Redmond, Sisters, Prineville, Madras, and surrounding communities. Our AI systems are trained on local data — Central Oregon rental markets, Central Oregon weather patterns, Central Oregon tenant demographics, Central Oregon contractor networks. A national property management company deploying generic AI can\'t match the local precision of a system built for this market.'),
      paragraph('When our AI evaluates a maintenance request, it knows that a "furnace not working" call in January in Bend at 15°F is a different priority than the same call in October at 50°F. That context comes from managing properties in this specific climate for over a decade.'),
      heading('Results That Speak'),
      paragraph('Innovation isn\'t about press releases — it\'s about performance. Our technology investments have produced measurable improvements: shorter vacancy periods, faster maintenance response times, lower emergency repair costs, higher tenant retention rates, and stronger net operating income for our owners. These aren\'t projections — they\'re outcomes we track across our portfolio.'),
      heading('What\'s Next'),
      paragraph('We\'re continuing to invest in AI and automation because the potential is enormous. Computer vision for automated property inspections. Advanced natural language processing for lease analysis. Machine learning models that optimize rent pricing in real time based on market signals. The property management industry is just beginning to understand what technology can do, and HDPM intends to stay at the leading edge.'),
      paragraph('If you\'re a property owner in Central Oregon looking for management that operates at the speed of 2026 — not 2016 — we\'d love to show you what\'s possible. Reach out for a free consultation and see the difference technology-forward management makes.'),
    ]),
  },
  {
    title: 'The Future of Property Management: AI, Automation, and What It Means for Your Rental',
    slug: 'future-of-property-management-ai-automation-rental',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-10T09:00:00.000Z',
    categorySlug: 'technology-innovation',
    tags: ['AI', 'Future', 'Automation', 'Property Management', 'Trends'],
    imageIndex: 9,
    seoTitle: 'The Future of AI in Property Management | HDPM Blog',
    seoDescription: 'What does the future of property management look like? HDPM explores how AI and automation are reshaping the rental industry for owners and tenants in Central Oregon.',
    body: richText([
      paragraph('The property management industry is at an inflection point. Over the next five years, AI and automation will change more about how rental properties are managed than the previous twenty years combined. For property owners and tenants in Central Oregon, understanding these changes isn\'t just interesting — it\'s essential for making smart decisions about your rental investments and living situations.'),
      paragraph('Here\'s where the industry is heading, and how HDPM is already building for this future.'),
      heading('AI-First Operations'),
      paragraph('The property management company of the future won\'t use AI as an add-on — it will be built around AI. Every interaction, every decision, every workflow will be augmented by intelligent systems that learn, adapt, and improve over time. Maintenance triage, tenant screening, lease pricing, owner reporting, vendor management — all of these functions will be AI-assisted or AI-driven.'),
      paragraph('This doesn\'t mean humans disappear. It means human property managers are freed from routine tasks to focus on judgment calls, relationship building, and complex problem-solving. The AI handles the 80% that\'s predictable so humans can focus on the 20% that requires expertise and empathy.'),
      heading('Predictive Everything'),
      paragraph('Today, we use AI to predict maintenance needs. Tomorrow, prediction will extend to every aspect of property management. Which tenants are likely to renew their lease? What rent price maximizes both occupancy and revenue? When will a property need a capital improvement to stay competitive? What market conditions will affect your investment next quarter?'),
      paragraph('These predictions won\'t be crystal ball guesses. They\'ll be data-driven forecasts based on thousands of data points from our portfolio, the local market, and broader economic indicators. Property owners will make proactive decisions based on forward-looking intelligence, not backward-looking reports.'),
      heading('Seamless Tenant Experiences'),
      paragraph('The friction in renting — searching, touring, applying, moving in, communicating, paying rent, requesting maintenance, renewing, moving out — will largely disappear. AI will automate the mechanical parts and personalize the human parts. Finding a rental will be as smooth as ordering a product online. Maintenance resolution will be tracked in real time like a package delivery. Communication will be instant, contextual, and available in any format the tenant prefers.'),
      heading('Computer Vision and IoT'),
      paragraph('Automated property inspections using computer vision will identify maintenance needs from photos and video. IoT sensors will monitor building systems continuously — detecting leaks, air quality changes, HVAC efficiency drops, and structural concerns in real time. The property itself will communicate its needs, reducing the gap between problem occurrence and detection from days to minutes.'),
      heading('The Consolidation Question'),
      paragraph('As AI reduces the per-door management overhead, larger companies will be able to manage more properties with fewer people. This will drive consolidation in the industry. But it also creates an opportunity for local operators who combine AI capability with deep market knowledge. National companies will have the technology; local companies will have the context. The winners will be those who have both.'),
      heading('How HDPM Is Positioned'),
      paragraph('We\'ve been building for this future for years. Our AI systems are already operational — not on a roadmap, not in beta, but live and producing results across approximately 850 managed doors in Central Oregon. We\'re investing continuously in new capabilities because we believe the property managers who embrace AI today will define the industry standard tomorrow.'),
      paragraph('For property owners in Central Oregon, the question isn\'t whether AI will transform property management — it\'s whether your current manager is ready for it. At HDPM, the future isn\'t something we\'re waiting for. It\'s something we\'re building.'),
    ]),
  },
]

// ─── Main seed function ─────────────────────────────────────────────
async function seed() {
  console.log('🤖 Starting HDPM AI blog seed...\n')

  const payload = await getPayload({ config })

  // 1. Create AI category
  console.log('📁 Creating category...')
  let categoryId: number
  const existing = await payload.find({
    collection: 'categories',
    where: { slug: { equals: AI_CATEGORY.slug } },
    limit: 1,
  })
  if (existing.docs.length > 0) {
    categoryId = existing.docs[0].id
    console.log(`  ✓ ${AI_CATEGORY.name} (exists)`)
  } else {
    const created = await payload.create({ collection: 'categories', data: AI_CATEGORY })
    categoryId = created.id
    console.log(`  + ${AI_CATEGORY.name}`)
  }

  // 2. Download and upload images
  console.log('\n📸 Downloading and uploading images...')
  const mediaMap: Record<number, number> = {}
  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i]
    try {
      const filePath = await downloadImage(img)

      const existingMedia = await payload.find({
        collection: 'media',
        where: { alt: { equals: img.alt } },
        limit: 1,
      })

      if (existingMedia.docs.length > 0) {
        mediaMap[i] = existingMedia.docs[0].id
        console.log(`  ✓ ${img.id} media (exists)`)
      } else {
        const fileBuffer = fs.readFileSync(filePath)
        const created = await payload.create({
          collection: 'media',
          data: { alt: img.alt, caption: img.caption },
          file: {
            data: fileBuffer,
            name: `${img.id}.jpg`,
            mimetype: 'image/jpeg',
            size: fileBuffer.length,
          },
        })
        mediaMap[i] = created.id
        console.log(`  + ${img.id} uploaded`)
      }
    } catch (err) {
      console.error(`  ✗ Failed to process ${img.id}:`, err)
    }
  }

  // 3. Create blog posts
  console.log('\n📝 Creating blog posts...')
  for (const post of POSTS) {
    const existingPost = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    })

    if (existingPost.docs.length > 0) {
      console.log(`  ✓ "${post.title}" (exists)`)
      continue
    }

    const data: Record<string, unknown> = {
      title: post.title,
      slug: post.slug,
      status: 'published' as const,
      publishedAt: post.publishedAt,
      author: post.author,
      categories: [categoryId],
      tags: post.tags.map((tag) => ({ tag })),
      body: post.body,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    }

    if (mediaMap[post.imageIndex] !== undefined) {
      data.featuredImage = mediaMap[post.imageIndex]
    }

    await payload.create({ collection: 'posts', data: data as never })
    console.log(`  + "${post.title}"`)
  }

  // Cleanup
  const tmpDir = path.join(__dirname, '../tmp-images')
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true })
    console.log('\n🧹 Cleaned up temporary images')
  }

  console.log('\n✅ AI blog seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
