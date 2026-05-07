/**
 * Seed script for HDPM blog posts.
 *
 * Usage:
 *   cd ~/code/hdpm/hdpm-web
 *   npx tsx scripts/seed-blog.ts
 *
 * Downloads Unsplash images, uploads them to Payload Media,
 * creates categories, and inserts 10 published blog posts.
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

// ─── Image definitions (Wikimedia Commons — Central Oregon specific) ──
const IMAGES: { id: string; url: string; alt: string }[] = [
  {
    id: 'bend-neighborhood',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5d/Bend%2C_Oregon_%282014%29_-_02.JPG/1920px-Bend%2C_Oregon_%282014%29_-_02.JPG',
    alt: 'Downtown Bend, Oregon with local shops and the Cascade mountain range in the background',
  },
  {
    id: 'tenant-moving',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Old_Mill_District%2C_Bend%2C_OR_2009.jpg/1920px-Old_Mill_District%2C_Bend%2C_OR_2009.jpg',
    alt: 'The Old Mill District in Bend, Oregon along the Deschutes River',
  },
  {
    id: 'winter-property',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/60/Mt._Bachelor%2C_Oregon%2C_early_morning.jpg/1920px-Mt._Bachelor%2C_Oregon%2C_early_morning.jpg',
    alt: 'Mt. Bachelor, Oregon covered in snow on an early winter morning',
  },
  {
    id: 'oregon-law',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Deschutes_River_%28Deschutes_County%2C_Oregon_scenic_images%29_%28desDA0093a%29.jpg',
    alt: 'The Deschutes River flowing through Deschutes County, Oregon',
  },
  {
    id: 'property-manager',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Smith_Rock_State_Park_Oregon_D3C1205-400516A033.jpg/1920px-Smith_Rock_State_Park_Oregon_D3C1205-400516A033.jpg',
    alt: 'Smith Rock State Park near Redmond, Oregon with the Crooked River below',
  },
  {
    id: 'pet-friendly',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Central_Oregon_landscape.jpg/1920px-Central_Oregon_landscape.jpg',
    alt: 'Wide open Central Oregon high desert landscape with juniper and sagebrush',
  },
  {
    id: 'central-oregon-living',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG/1920px-Main_road_in_Sisters_town%2C_Oregon_in_2011_%281%29.JPG',
    alt: 'Main street in downtown Sisters, Oregon with the Cascade mountains in the background',
  },
  {
    id: 'wildfire-prep',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Forest_in_Central_Oregon_2.jpg/1920px-Forest_in_Central_Oregon_2.jpg',
    alt: 'Dense ponderosa pine forest in Central Oregon during fire season',
  },
  {
    id: 'rental-income',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg/1920px-View_of_South_Sister_and_Broken_Top_from_the_Cascade_Lakes_National_Scenic_Byway_near_the_bottom_of_Mount_Bachelor%2C_2011.jpg',
    alt: 'South Sister and Broken Top mountains from the Cascade Lakes Scenic Byway near Mt. Bachelor',
  },
  {
    id: 'things-to-do',
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg/1920px-Three_Sisters_and_Mirror_Lake%2C_Oregon_%2875490%29.jpg',
    alt: 'The Three Sisters mountains reflected in Mirror Lake, Central Oregon',
  },
]

// ─── Download image from Unsplash ───────────────────────────────────
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

// ─── Category definitions ───────────────────────────────────────────
const CATEGORIES = [
  { name: 'Property Management', slug: 'property-management', description: 'Tips and insights for property owners and managers in Central Oregon' },
  { name: 'Tenant Resources', slug: 'tenant-resources', description: 'Helpful guides and information for renters in Central Oregon' },
  { name: 'Central Oregon Living', slug: 'central-oregon-living', description: 'Area guides, lifestyle, and community highlights across Central Oregon' },
  { name: 'Oregon Rental Law', slug: 'oregon-rental-law', description: 'Legal updates and compliance information for Oregon landlords and tenants' },
  { name: 'Seasonal Tips', slug: 'seasonal-tips', description: 'Season-specific property maintenance and living guides for the high desert' },
]

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
    title: 'A Neighborhood Guide to Bend, Oregon: Where to Rent in 2026',
    slug: 'neighborhood-guide-bend-oregon-where-to-rent-2026',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-15T09:00:00.000Z',
    categorySlug: 'central-oregon-living',
    tags: ['Bend', 'Neighborhoods', 'Rentals', 'Relocation'],
    imageIndex: 0,
    seoTitle: 'Bend Oregon Neighborhood Guide for Renters | HDPM Blog',
    seoDescription: 'Explore the best neighborhoods to rent in Bend, Oregon in 2026. From the Old Mill District to NorthWest Crossing, find the right fit for your lifestyle and budget.',
    body: richText([
      paragraph('Bend has evolved from a small mountain town into one of the most sought-after places to live in the Pacific Northwest. Whether you are relocating for work, lifestyle, or retirement, understanding the distinct character of each neighborhood will help you find the right rental. Here is our local guide to the areas that make Bend special.'),
      heading('The Old Mill District'),
      paragraph('Once a working lumber mill, this area has been transformed into a vibrant mixed-use district along the Deschutes River. Renters here enjoy walkable access to shopping, restaurants, and the Les Schwab Amphitheater. Expect to pay a premium for the convenience — one-bedroom apartments typically start around $1,800 per month, but the lifestyle payoff is hard to beat.'),
      heading('NorthWest Crossing'),
      paragraph('This master-planned community on Bend\'s west side blends modern design with outdoor accessibility. Townhomes and single-family rentals are popular with young professionals and families. Discovery Park provides a central gathering spot, and the neighborhood has its own shops and eateries. Rents for a three-bedroom home generally range from $2,400 to $3,200.'),
      heading('Downtown Bend'),
      paragraph('Living downtown puts you steps from craft breweries, boutique shops, and Drake Park along Mirror Pond. Apartments dominate the housing stock here, and vacancies are tight. The vibe is walkable and social — ideal for remote workers who want coffee shops and nightlife at their doorstep.'),
      heading('Southeast Bend'),
      paragraph('For renters looking for more space at a lower price point, Southeast Bend delivers. Neighborhoods along 15th Street and Reed Market Road offer larger homes with yards, good school access, and easy highway connections for commuters heading to Redmond or Prineville. This is where families often find the best value.'),
      heading('West Side / Century West'),
      paragraph('The west side of Bend sits closest to Mt. Bachelor and the Cascade Lakes. Rentals here tend to be higher-end, with proximity to mountain biking trails, skiing, and the Deschutes National Forest. If outdoor recreation defines your lifestyle, this is the neighborhood to target.'),
      heading('Midtown / Galveston Avenue'),
      paragraph('Midtown is experiencing a renaissance. The Galveston Avenue corridor has seen new restaurants, breweries, and mixed-use development. Rental prices are slightly below the Old Mill and downtown areas, making it a strong option for tenants who want walkability without the highest price tag.'),
      heading('What to Consider When Choosing'),
      paragraph('Beyond rent price, think about your commute, proximity to outdoor recreation, and the type of community you want. Bend\'s traffic has increased significantly in recent years, so living near your workplace or favorite trailhead can save you real time and frustration. We recommend visiting neighborhoods in person before signing a lease — the feel of a place matters as much as the floor plan.'),
      paragraph('At High Desert Property Management, we manage rentals across every Bend neighborhood. If you are searching for your next home, check our available listings or reach out — we are happy to help you navigate the Bend rental market.'),
    ]),
  },
  {
    title: 'The Ultimate Tenant Move-In Checklist for Central Oregon',
    slug: 'tenant-move-in-checklist-central-oregon',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-10T09:00:00.000Z',
    categorySlug: 'tenant-resources',
    tags: ['Moving', 'Tenants', 'Checklist', 'Central Oregon'],
    imageIndex: 1,
    seoTitle: 'Tenant Move-In Checklist for Central Oregon Rentals | HDPM',
    seoDescription: 'Your complete move-in checklist for renting in Central Oregon. From utility transfers to documenting your unit, get organized before your first day.',
    body: richText([
      paragraph('Moving into a new rental is exciting, but it can also be overwhelming. Central Oregon has some unique considerations — from setting up propane delivery to preparing for high desert weather. Use this checklist to make sure nothing falls through the cracks.'),
      heading('Two Weeks Before Move-In'),
      paragraph('Start with utility transfers. Contact Central Electric Cooperative or Pacific Power to set up your electric service. If your rental uses natural gas, call Cascade Natural Gas. Many Central Oregon homes use propane for heating, so confirm your provider and schedule a fill if the tank is low. Set up internet through Bend Broadband or TDS Telecom — installation appointments fill up fast, especially in summer.'),
      paragraph('Purchase renter\'s insurance. Most landlords and property managers in Oregon require it, and it protects your belongings against fire, theft, and weather damage. Policies typically cost between $15 and $30 per month and are well worth the peace of mind.'),
      heading('One Week Before Move-In'),
      paragraph('Submit your forwarding address to USPS. Update your driver\'s license and vehicle registration with the Oregon DMV — you have 30 days after establishing residency. Notify your bank, employer, and any subscription services of your new address.'),
      paragraph('Stock up on moving supplies. If you are moving during winter months, keep in mind that ice and snow may affect the timeline. Have salt or sand available for walkways, and plan your move for midday when temperatures are warmest.'),
      heading('Move-In Day: Document Everything'),
      paragraph('This is the most important step many tenants skip. Before you unpack a single box, walk through the entire unit with your phone camera. Photograph every room, every wall, every appliance. Open cabinets, check under sinks, test every light switch and outlet. Note any existing damage — scuffs, stains, chips, or wear — on your move-in condition report.'),
      paragraph('This documentation protects your security deposit when you move out. Be thorough and submit your completed report to your property manager within the timeframe specified in your lease, which is typically 48 to 72 hours.'),
      heading('First Week Essentials'),
      paragraph('Locate your circuit breaker panel, water shut-off valve, and furnace filter. Know where these are before you need them. Replace the furnace filter if it looks dirty — Central Oregon\'s dry, dusty climate means filters clog faster than in wetter regions. Test your smoke detectors and carbon monoxide alarms.'),
      paragraph('Introduce yourself to your neighbors. In Central Oregon communities, neighbors often look out for each other, and a quick hello goes a long way — especially if you need to coordinate parking, shared fences, or snow removal.'),
      heading('Setting Up for High Desert Living'),
      paragraph('Central Oregon\'s climate is unlike anywhere else in the state. Summers are dry and sunny with temps reaching the 90s, while winters bring snow and subfreezing nights. Keep a basic emergency kit in your home: flashlight, batteries, blankets, water, and non-perishable food. Power outages during winter storms are not uncommon.'),
      paragraph('If your rental has a swamp cooler or evaporative cooling system, learn how to operate it before summer hits. These systems work differently from traditional AC and require occasional maintenance.'),
      paragraph('High Desert Property Management provides every new tenant with a detailed move-in guide specific to their property. If you have questions during your first week, we are always just a phone call away.'),
    ]),
  },
  {
    title: 'Winter Property Maintenance in the High Desert: An Owner\'s Guide',
    slug: 'winter-property-maintenance-high-desert-owners-guide',
    author: 'Craig Bramscher',
    publishedAt: '2026-03-05T09:00:00.000Z',
    categorySlug: 'seasonal-tips',
    tags: ['Winter', 'Maintenance', 'Property Owners', 'High Desert'],
    imageIndex: 2,
    seoTitle: 'Winter Property Maintenance Guide for Central Oregon Owners | HDPM',
    seoDescription: 'Protect your Central Oregon rental property through harsh high desert winters. Essential maintenance tips for pipes, roofs, heating systems, and more.',
    body: richText([
      paragraph('Central Oregon winters are no joke. With temperatures regularly dipping below zero and snowfall measured in feet, not inches, rental properties need to be winterized properly. Deferred maintenance in November becomes an emergency repair in January. Here is what every property owner should prioritize.'),
      heading('Protect Your Pipes'),
      paragraph('Frozen pipes are the number one winter damage issue we see in Central Oregon rentals. Insulate all exposed pipes in crawl spaces, garages, and exterior walls. Heat tape is a worthwhile investment for vulnerable sections. Make sure tenants know to keep cabinet doors open under sinks during extreme cold snaps and to maintain at least 55°F interior temperature, even when away.'),
      paragraph('If a property will be vacant for any period during winter, consider a full winterization — draining the water system and adding antifreeze to traps. The cost of winterization is a fraction of what a burst pipe repair will run you.'),
      heading('Heating System Checkup'),
      paragraph('Schedule a professional furnace inspection before the cold hits. This includes checking the heat exchanger, cleaning burners, testing the thermostat, and replacing the filter. In Central Oregon, many homes use forced-air gas furnaces or heat pumps that work overtime from November through March.'),
      paragraph('For properties with baseboard heating or wood stoves, ensure chimneys are swept and flues are clear. Creosote buildup is a real fire risk, especially in homes where tenants burn wood regularly.'),
      heading('Roof and Gutter Maintenance'),
      paragraph('Heavy snow loads can stress roofing systems, especially on older homes. Inspect your roof for damaged or missing shingles before the first snowfall. Clean gutters and downspouts to prevent ice dams — when gutters freeze, water backs up under shingles and causes interior water damage.'),
      paragraph('If your property has a flat or low-slope roof section, consider installing heat cables along the eaves. Ice dams are particularly common on these roof types in the high desert.'),
      heading('Exterior and Landscaping'),
      paragraph('Shut off and drain exterior hose bibs. This is simple, takes five minutes, and prevents one of the most common freeze-related repairs. Store garden hoses indoors. Trim back any tree branches that hang over the roof or power lines — heavy snow can bring branches down.'),
      paragraph('Apply a sealant to wooden decks and fences before winter. The freeze-thaw cycle in Central Oregon is brutal on wood. A good sealant extends the life of exterior wood by years.'),
      heading('Emergency Preparedness'),
      paragraph('Make sure your property has working smoke detectors and carbon monoxide alarms — winter is when heating-related fire and CO incidents spike. Provide tenants with emergency contact information and clear instructions on what to do if the power goes out or pipes freeze.'),
      paragraph('At High Desert Property Management, we handle all seasonal maintenance for our managed properties. Our preventive maintenance program catches issues before they become costly emergencies. If you want to protect your investment through the winter, reach out to our team.'),
    ]),
  },
  {
    title: 'Understanding Oregon Rental Laws: What Every Tenant Should Know',
    slug: 'understanding-oregon-rental-laws-tenant-guide',
    author: 'Craig Bramscher',
    publishedAt: '2026-02-28T09:00:00.000Z',
    categorySlug: 'oregon-rental-law',
    tags: ['Oregon Law', 'Tenant Rights', 'Rental Law', 'Legal'],
    imageIndex: 3,
    seoTitle: 'Oregon Rental Laws Guide for Tenants | HDPM Blog',
    seoDescription: 'Understand your rights as a tenant in Oregon. From security deposits to eviction protections, here is what the law says and how it affects your rental.',
    body: richText([
      paragraph('Oregon has some of the most tenant-protective rental laws in the country. Whether you are renting your first apartment in Bend or have been a long-term tenant in Redmond, understanding your rights — and responsibilities — under Oregon law helps you navigate your rental relationship with confidence.'),
      heading('Security Deposits'),
      paragraph('Oregon law does not cap the amount a landlord can charge for a security deposit, but it does have strict rules about how deposits are handled. Your landlord must return your deposit within 31 days of your move-out date, along with an itemized statement of any deductions. Deductions must be for actual damages beyond normal wear and tear — a landlord cannot charge you for routine carpet cleaning or minor scuffs from everyday living.'),
      paragraph('Pro tip: always complete a thorough move-in inspection and document the condition of your unit with photos. This is your best protection if there is ever a dispute about your deposit.'),
      heading('Rent Increases'),
      paragraph('Oregon\'s statewide rent control law (SB 608, updated in subsequent sessions) limits annual rent increases to 7% plus the consumer price index for most properties. There are exceptions — buildings less than 15 years old and certain subsidized housing are exempt. Your landlord must give you at least 90 days written notice before any rent increase takes effect.'),
      paragraph('If you receive a rent increase notice that seems higher than the legal limit, you have the right to challenge it. Start by contacting the Oregon Rental Housing Alliance or a local legal aid organization.'),
      heading('Eviction Protections'),
      paragraph('Oregon requires landlords to provide specific notice periods and valid reasons for eviction in most cases. For month-to-month tenancies, a landlord must give 90 days notice for a no-cause termination — and in some cases, they must pay relocation assistance equal to one month\'s rent. For-cause evictions, such as nonpayment of rent or lease violations, have shorter timelines but still require proper notice.'),
      paragraph('Portland has additional local eviction protections, but in Central Oregon, state law is the primary framework. Familiarize yourself with ORS Chapter 90, which governs all residential landlord-tenant relations in Oregon.'),
      heading('Repairs and Habitability'),
      paragraph('Your landlord is legally required to maintain your rental in a habitable condition. This includes working plumbing, heating, electrical systems, and a weatherproof structure. If something breaks, submit a written repair request. If the landlord fails to address a serious repair within a reasonable time, Oregon law provides tenants with specific remedies, including the right to repair and deduct or to terminate the lease in extreme cases.'),
      paragraph('Keep copies of all maintenance requests and communications. Email or your tenant portal creates a paper trail that protects both parties.'),
      heading('Right to Privacy'),
      paragraph('Oregon requires landlords to give at least 24 hours written notice before entering your rental, except in genuine emergencies like a burst pipe or fire. Routine inspections, showings, and maintenance must be scheduled with proper notice. You have the right to deny entry if proper notice was not given.'),
      heading('Resources'),
      paragraph('The Oregon State Bar offers a Lawyer Referral Service for tenant rights questions. Community Alliance of Tenants is a Portland-based nonprofit that serves tenants statewide. In Central Oregon, Legal Aid Services of Oregon provides free legal help for qualifying tenants.'),
      paragraph('At High Desert Property Management, we follow Oregon law to the letter and believe that clear communication prevents most disputes. If you have questions about your lease or your rights, do not hesitate to reach out.'),
    ]),
  },
  {
    title: 'Why Hire a Property Manager in Central Oregon? 8 Reasons It Pays Off',
    slug: 'why-hire-property-manager-central-oregon',
    author: 'Craig Bramscher',
    publishedAt: '2026-02-20T09:00:00.000Z',
    categorySlug: 'property-management',
    tags: ['Property Management', 'Investment', 'Owners', 'Central Oregon'],
    imageIndex: 4,
    seoTitle: '8 Reasons to Hire a Central Oregon Property Manager | HDPM',
    seoDescription: 'Wondering if you need a property manager for your Central Oregon rental? Here are 8 concrete reasons professional management protects your investment and your time.',
    body: richText([
      paragraph('You bought a rental property in Central Oregon because it seemed like a smart investment. And it is — if it is managed well. But many owners underestimate the time, knowledge, and energy that effective property management demands. Here are eight reasons hiring a professional manager pays for itself.'),
      heading('1. Tenant Screening That Actually Works'),
      paragraph('A bad tenant can cost you thousands in missed rent, property damage, and legal fees. Professional property managers run comprehensive background checks including credit, criminal, eviction history, employment verification, and rental references. We have seen the patterns — we know what red flags to look for that a first-time landlord might miss.'),
      heading('2. Market-Rate Pricing'),
      paragraph('Set rent too high and your property sits vacant. Set it too low and you leave money on the table. Property managers track local market data across Bend, Redmond, Sisters, Prineville, and Madras to price your unit competitively. Even a 5% pricing improvement on a $2,000 per month rental adds up to $1,200 per year in additional income.'),
      heading('3. Legal Compliance'),
      paragraph('Oregon rental law is complex and changes frequently. From security deposit handling to eviction procedures to fair housing compliance, the legal landscape has real teeth. A single misstep can result in penalties, lawsuits, or both. Professional managers stay current on every regulation so you do not have to.'),
      heading('4. Maintenance Coordination'),
      paragraph('When a pipe bursts at 2 AM in January, your tenant calls us, not you. We have established relationships with licensed contractors, plumbers, electricians, and HVAC technicians across Central Oregon. That means faster response times, negotiated rates, and quality work — all without you having to manage the process.'),
      heading('5. Rent Collection and Accounting'),
      paragraph('Consistent rent collection is the foundation of a profitable rental. We handle automated rent collection, late fee enforcement, and clear financial reporting. You get a monthly owner statement and a year-end tax package. No chasing tenants, no awkward conversations.'),
      heading('6. Lower Vacancy Rates'),
      paragraph('Our average time-to-fill across the HDPM portfolio is significantly below the Central Oregon market average. We achieve this through professional photography, broad listing syndication, responsive showing schedules, and a strong reputation with local renters. Every day your property sits empty is money lost.'),
      heading('7. Reduced Stress and Time'),
      paragraph('Managing a rental property is essentially a part-time job — sometimes a full-time one. Between tenant communications, maintenance calls, lease renewals, inspections, and bookkeeping, the hours add up. Hiring a property manager buys back your time so you can focus on your career, family, or next investment.'),
      heading('8. Protecting Your Asset Long-Term'),
      paragraph('Regular inspections, preventive maintenance, and proactive communication with tenants extend the life of your property and preserve its value. We conduct routine drive-by and interior inspections, address small issues before they become big problems, and ensure tenants are taking care of your property.'),
      paragraph('High Desert Property Management has been managing rentals across Central Oregon for over a decade. We currently manage hundreds of doors across Central Oregon and bring local expertise that out-of-area management companies cannot match. If you are considering professional management, give us a call for a free rental analysis.'),
    ]),
  },
  {
    title: 'Pet Policies for Rental Properties: A Balanced Approach for Oregon Landlords',
    slug: 'pet-policies-rental-properties-oregon-landlords',
    author: 'Craig Bramscher',
    publishedAt: '2026-02-15T09:00:00.000Z',
    categorySlug: 'property-management',
    tags: ['Pets', 'Pet Policy', 'Landlords', 'Oregon'],
    imageIndex: 5,
    seoTitle: 'Pet Policies for Oregon Rental Properties | HDPM Blog',
    seoDescription: 'Should you allow pets in your Central Oregon rental? How to create a pet policy that protects your property while attracting quality tenants.',
    body: richText([
      paragraph('The question of whether to allow pets in a rental property is one of the most common decisions Central Oregon landlords face. Nearly 70% of renters have at least one pet, and in a dog-friendly market like Bend, restricting pets means significantly narrowing your tenant pool. Here is how to approach pet policies strategically.'),
      heading('The Business Case for Allowing Pets'),
      paragraph('Properties that accept pets rent faster and retain tenants longer. Pet owners know how difficult it is to find pet-friendly housing, so they tend to stay put when they find a good situation. Lower turnover means fewer vacancy periods and less wear from move-in and move-out cycles.'),
      paragraph('Pet deposits and monthly pet rent also add to your bottom line. In Central Oregon, a typical structure is a $250 to $500 pet deposit (refundable) plus $25 to $50 per month in pet rent. On a single property, that is an extra $300 to $600 per year in revenue.'),
      heading('Setting Clear Pet Guidelines'),
      paragraph('A good pet policy is specific. Define the number of pets allowed (we recommend a maximum of two), weight limits if applicable, and any breed restrictions your insurance requires. Require proof of vaccinations and licensing. Specify that pets must be leashed in common areas and that tenants are responsible for immediate cleanup.'),
      paragraph('Put everything in writing as a pet addendum to the lease. Verbal agreements lead to misunderstandings. The addendum should clearly state the consequences of policy violations, including potential lease termination for repeated offenses.'),
      heading('Protecting Your Property'),
      paragraph('Pet damage is a legitimate concern, but it is manageable with the right approach. Luxury vinyl plank flooring is virtually pet-proof and costs less to install than hardwood. Avoid carpet in pet-friendly units whenever possible — if you must have carpet, choose a low-pile commercial grade that is easier to clean and replace.'),
      paragraph('Conduct regular inspections. Catching issues early — like a tenant who is letting their dog destroy the backyard — prevents costly repairs later. Most pet damage we see at HDPM is minor and easily covered by the pet deposit.'),
      heading('Service Animals and Emotional Support Animals'),
      paragraph('Under federal and Oregon fair housing law, service animals and emotional support animals are not pets. You cannot charge a pet deposit, pet rent, or apply breed or weight restrictions to these animals. You can request documentation of the disability-related need for an emotional support animal, but you cannot require specific training or certification.'),
      paragraph('This is an area where many landlords inadvertently violate fair housing law. If you are unsure how to handle a service or support animal request, consult with a property manager or attorney who understands Oregon fair housing requirements.'),
      heading('Our Recommendation'),
      paragraph('At HDPM, the vast majority of our managed properties allow pets with reasonable restrictions. The math works: broader tenant pools, faster leasing, longer tenancies, and the additional revenue from pet rent. Combined with proper screening and clear policies, pet-friendly properties outperform no-pet properties in our portfolio.'),
      paragraph('If you are an owner considering updating your pet policy, we can help you structure it to protect your property while maximizing your rental\'s appeal. Reach out to our team for a free consultation.'),
    ]),
  },
  {
    title: 'Cost of Living in Central Oregon: Bend vs. Redmond vs. Sisters',
    slug: 'cost-of-living-central-oregon-bend-redmond-sisters',
    author: 'Craig Bramscher',
    publishedAt: '2026-02-10T09:00:00.000Z',
    categorySlug: 'central-oregon-living',
    tags: ['Cost of Living', 'Bend', 'Redmond', 'Sisters', 'Comparison'],
    imageIndex: 6,
    seoTitle: 'Cost of Living: Bend vs Redmond vs Sisters Oregon | HDPM',
    seoDescription: 'Compare the cost of living across Central Oregon\'s top three cities. Rent, utilities, groceries, and lifestyle costs in Bend, Redmond, and Sisters.',
    body: richText([
      paragraph('Central Oregon is one of the fastest-growing regions in the state, and each of its cities offers a distinct lifestyle at a different price point. Whether you are relocating for work, retirement, or simply a change of pace, understanding the real cost differences between Bend, Redmond, and Sisters will help you make a smarter decision.'),
      heading('Rental Costs'),
      paragraph('Bend is the most expensive rental market in Central Oregon. A one-bedroom apartment averages $1,600 to $1,900 per month, while a three-bedroom home runs $2,400 to $3,500 depending on the neighborhood. West side and downtown locations command the highest rents.'),
      paragraph('Redmond offers significantly more affordable housing. One-bedroom apartments average $1,200 to $1,500, and three-bedroom homes range from $1,800 to $2,600. Redmond has experienced rapid growth, with new construction adding inventory that helps moderate prices.'),
      paragraph('Sisters is a small-town market with limited rental inventory. When homes become available, they rent quickly. Expect to pay Bend-adjacent prices — $1,500 to $1,800 for a one-bedroom and $2,200 to $3,000 for a three-bedroom — but with fewer options to choose from.'),
      heading('Utilities and Essentials'),
      paragraph('Utility costs are relatively consistent across the three cities. Electric bills run $100 to $180 per month depending on heating type and home size. Natural gas adds $50 to $120 in winter months. Internet service is $60 to $90 for reliable plans. Water and sewer, where applicable, typically run $60 to $100.'),
      paragraph('One factor that catches newcomers off guard is heating costs. Central Oregon winters are cold, and heating a poorly insulated older home can be expensive. Ask about insulation, window quality, and heating system efficiency before signing a lease.'),
      heading('Groceries and Dining'),
      paragraph('Grocery costs are roughly 5 to 10% above the national average across all three cities. Bend has the widest selection of grocery stores, from budget-friendly WinCo to upscale options like Newport Avenue Market. Redmond has Costco, which is a draw for the entire region. Sisters has a Bi-Mart and a small Ray\'s Food Place — for a full grocery run, most Sisters residents drive to Bend or Redmond.'),
      paragraph('Dining out is significantly more expensive in Bend, where the restaurant scene is robust but priced accordingly. Redmond and Sisters have excellent local restaurants at slightly lower price points.'),
      heading('Transportation'),
      paragraph('A car is essential in Central Oregon. Public transit exists through Cascades East Transit, but service is limited compared to metro areas. Gas prices tend to run $0.10 to $0.20 above the national average. Commuting between cities is common — Redmond to Bend is about 20 minutes, Sisters to Bend about 25 minutes.'),
      paragraph('If you work in Bend but want lower rent, Redmond is the most common commuter choice. The drive is straightforward on Highway 97, though winter conditions occasionally require extra caution.'),
      heading('Which City Is Right for You?'),
      paragraph('Choose Bend if you prioritize walkability, dining, nightlife, and proximity to outdoor recreation, and you can afford the premium. Choose Redmond if you want affordability, more space, and do not mind a short commute. Choose Sisters if you love small-town charm, access to the Cascades, and are comfortable with limited inventory and higher prices for what is available.'),
      paragraph('Wherever you land in Central Oregon, High Desert Property Management can help you find a rental that fits your budget and lifestyle. Browse our current listings or contact us for personalized recommendations.'),
    ]),
  },
  {
    title: 'Preparing Your Rental Property for Wildfire Season in Central Oregon',
    slug: 'preparing-rental-property-wildfire-season-central-oregon',
    author: 'Craig Bramscher',
    publishedAt: '2026-02-05T09:00:00.000Z',
    categorySlug: 'seasonal-tips',
    tags: ['Wildfire', 'Fire Safety', 'Property Maintenance', 'Summer'],
    imageIndex: 7,
    seoTitle: 'Wildfire Season Prep for Central Oregon Rental Properties | HDPM',
    seoDescription: 'Protect your Central Oregon rental property from wildfire risk. Defensible space, insurance, evacuation planning, and landlord responsibilities.',
    body: richText([
      paragraph('Wildfire is a fact of life in Central Oregon. The high desert climate — hot, dry summers with regular wind events — creates conditions that can escalate a small fire into a major threat within hours. As a property owner, preparing your rental for wildfire season is not optional. It protects your investment, your tenants, and your community.'),
      heading('Understanding the Risk'),
      paragraph('Central Oregon sits in the wildland-urban interface, where developed areas meet undeveloped forest and rangeland. Communities like Bend, Redmond, Sisters, La Pine, and Sunriver all face varying degrees of wildfire risk. The 2017 Milli Fire near Sisters and the 2020 fires that devastated parts of Southern Oregon are recent reminders of how quickly conditions can change.'),
      paragraph('Deschutes County Fire Adapted Communities and Project Wildfire are local organizations that provide risk assessments and resources. Knowing your property\'s specific risk level is the first step.'),
      heading('Creating Defensible Space'),
      paragraph('Defensible space is the area around a structure where vegetation and other materials are managed to reduce fire risk. Oregon recommends three zones. Zone 1 extends zero to five feet from the structure — this area should be free of all combustible materials, including bark mulch, firewood stacks, and dried vegetation. Zone 2, from five to 30 feet, should have well-spaced, well-maintained landscaping with fire-resistant plants. Zone 3, from 30 to 100 feet, involves thinning trees and removing dead wood.'),
      paragraph('For rental properties, defensible space maintenance should be clearly addressed in the lease. Specify who is responsible for yard maintenance and at what standard. Many property managers, including HDPM, include defensible space maintenance in their management scope.'),
      heading('Hardening the Structure'),
      paragraph('The building itself can be made more fire-resistant. Clear debris from gutters and roofs — ember accumulation in gutters is a leading cause of structure ignition during wildfires. Screen attic vents and crawl space openings with 1/8-inch metal mesh to prevent embers from entering. Ensure decks and porches are clear of combustible storage.'),
      paragraph('If you are making capital improvements, consider fire-resistant roofing materials (Class A rated), fiber cement siding, and tempered glass windows. These upgrades reduce risk and may lower your insurance premiums.'),
      heading('Insurance Considerations'),
      paragraph('Wildfire insurance coverage in Central Oregon has become more complex and expensive in recent years. Some insurers have pulled out of high-risk areas or significantly increased premiums. Review your policy annually, confirm your coverage limits reflect current replacement costs, and understand your deductible. If you are in a high-risk zone, the Oregon FAIR Plan provides last-resort coverage.'),
      heading('Tenant Communication and Evacuation Planning'),
      paragraph('Every tenant should know the evacuation routes for their area. Deschutes County uses a tiered evacuation system — Level 1 (Be Ready), Level 2 (Be Set), and Level 3 (Go). Share this information with tenants at lease signing and again at the start of each fire season.'),
      paragraph('Provide tenants with a list of items to have ready in a go-bag: important documents, medications, phone chargers, water, and a change of clothes. Encourage them to sign up for Deschutes County 911 alerts for real-time evacuation notifications.'),
      heading('Our Proactive Approach'),
      paragraph('At HDPM, wildfire preparedness is part of our annual maintenance cycle. We conduct defensible space assessments, coordinate vegetation management, and communicate directly with tenants about fire season preparedness. For owners in high-risk areas, we provide specific recommendations for structural hardening and insurance review.'),
      paragraph('Central Oregon is a beautiful place to own property. With proper preparation, the wildfire risk is manageable. Contact us if you want a professional assessment of your rental property\'s wildfire readiness.'),
    ]),
  },
  {
    title: 'How to Maximize Rental Income on Your Central Oregon Investment Property',
    slug: 'maximize-rental-income-central-oregon-investment-property',
    author: 'Craig Bramscher',
    publishedAt: '2026-01-28T09:00:00.000Z',
    categorySlug: 'property-management',
    tags: ['Rental Income', 'Investment', 'Property Owners', 'ROI'],
    imageIndex: 8,
    seoTitle: 'Maximize Rental Income in Central Oregon | HDPM Blog',
    seoDescription: 'Proven strategies to increase rental income on your Central Oregon property. From strategic upgrades to reducing vacancy, here is how to boost your ROI.',
    body: richText([
      paragraph('Owning rental property in Central Oregon can be highly profitable, but maximizing your return takes more than simply collecting rent. The difference between an average-performing rental and a top-performing one often comes down to strategic decisions about pricing, improvements, and management. Here are the levers that move the needle.'),
      heading('Price It Right from Day One'),
      paragraph('Overpricing your rental by even $100 per month can result in weeks of vacancy, costing you far more than the premium you were hoping to capture. A property sitting empty for 30 days at $2,000 per month costs you $2,000 — that\'s nearly 17 months of that extra $100 to break even. Use current market comparables, not what you wish the market would pay.'),
      paragraph('At HDPM, we run a detailed comparative market analysis for every property we manage. We look at similar properties within a half-mile radius, adjusting for square footage, condition, amenities, and location. Accurate pricing fills units faster.'),
      heading('Strategic Upgrades That Tenants Value'),
      paragraph('Not all improvements deliver equal returns. Focus on what tenants actually care about. Updated kitchens with modern countertops and stainless steel appliances consistently command higher rents. New luxury vinyl plank flooring is durable, attractive, and costs less than hardwood. Fresh interior paint in neutral tones makes units feel clean and move-in ready.'),
      paragraph('In-unit washer and dryer hookups — or better yet, providing the machines — is one of the highest-value amenities in Central Oregon. Smart thermostats, keyless entry, and updated light fixtures are relatively inexpensive upgrades that signal quality and justify higher rent.'),
      heading('Minimize Vacancy'),
      paragraph('Every vacant day is lost revenue that never comes back. Start marketing your property 45 to 60 days before the current tenant\'s lease ends. Professional photography makes a significant difference — listings with high-quality photos receive 118% more views. Respond to inquiries the same day and offer flexible showing times.'),
      paragraph('Consider offering lease renewal incentives to good tenants. A small rent reduction or a minor upgrade (new blinds, a deep carpet clean) costs far less than a month of vacancy plus turnover expenses.'),
      heading('Reduce Turnover Costs'),
      paragraph('Tenant turnover is expensive. Between cleaning, painting, repairs, marketing, and vacancy time, the average turnover costs $2,500 to $5,000 in Central Oregon. Retaining good tenants should be a priority. Be responsive to maintenance requests, communicate clearly, and treat tenants with respect. Most tenants leave not because of rent increases but because of poor management.'),
      heading('Control Operating Expenses'),
      paragraph('Review your property\'s operating expenses annually. Are you getting competitive rates on insurance? Have you compared landscaping bids recently? Are your utilities (for owner-paid items like water or trash) being monitored for waste? Small savings compound over time.'),
      paragraph('Preventive maintenance is also a cost-control strategy. A $200 furnace tune-up prevents a $3,000 mid-winter replacement. A $50 gutter cleaning prevents $5,000 in water damage. Invest in maintenance proactively, not reactively.'),
      heading('Consider Professional Management'),
      paragraph('Many owners view management fees as an expense. In reality, professional management is an investment that typically pays for itself through higher rents, lower vacancy, reduced turnover, and fewer costly mistakes. Our management fee is offset by the revenue we generate and the expenses we prevent.'),
      paragraph('If you own rental property in Central Oregon and want to explore how to increase your returns, reach out to High Desert Property Management for a free rental analysis. We will show you exactly where the opportunities are.'),
    ]),
  },
  {
    title: '15 Things to Do in Central Oregon: Your Local Area Guide',
    slug: '15-things-to-do-central-oregon-local-area-guide',
    author: 'Craig Bramscher',
    publishedAt: '2026-01-20T09:00:00.000Z',
    categorySlug: 'central-oregon-living',
    tags: ['Central Oregon', 'Things to Do', 'Lifestyle', 'Recreation'],
    imageIndex: 9,
    seoTitle: '15 Best Things to Do in Central Oregon | HDPM Blog',
    seoDescription: 'Discover the best activities and attractions in Central Oregon. From outdoor adventures to local culture, here is your guide to living in the high desert.',
    body: richText([
      paragraph('Central Oregon is not just a place to live — it is a lifestyle. With over 300 days of sunshine, world-class outdoor recreation, and a thriving arts and food scene, there is never a shortage of things to do. Whether you are a new tenant exploring the area or a long-time resident looking for fresh ideas, here is our local\'s guide to the best of Central Oregon.'),
      heading('1. Float the Deschutes River'),
      paragraph('From June through September, floating the Deschutes River through Bend is a Central Oregon rite of passage. The most popular stretch runs from Riverbend Park to Drake Park — about two hours of relaxing float time. Bring a tube, sunscreen, and a dry bag for your phone. Shuttle services run all summer.'),
      heading('2. Ski or Snowboard at Mt. Bachelor'),
      paragraph('With over 4,300 acres of skiable terrain, Mt. Bachelor is the Pacific Northwest\'s premier ski destination. The season typically runs from late November through May. Just 25 minutes from Bend, it is an easy day trip — many locals ski before work or after school.'),
      heading('3. Explore Smith Rock State Park'),
      paragraph('Smith Rock is the birthplace of American sport climbing and one of the most stunning landscapes in Oregon. Even if you do not climb, the hiking trails offer incredible views of the Crooked River canyon. The Misery Ridge trail is challenging but rewarding. Located just north of Redmond, it is one of the most photographed locations in the state.'),
      heading('4. Mountain Bike the Phil\'s Trail System'),
      paragraph('Bend is a mountain biking mecca, and Phil\'s Trail is the crown jewel. With over 30 miles of singletrack ranging from beginner-friendly to expert-only, there is something for every skill level. The trail system is minutes from town and beautifully maintained by the Central Oregon Trail Alliance.'),
      heading('5. Visit the High Desert Museum'),
      paragraph('Part zoo, part museum, part nature center — the High Desert Museum south of Bend is a world-class facility that explores the natural and cultural history of the high desert. The raptor flight demonstrations, otter exhibit, and rotating art galleries make it worth multiple visits.'),
      heading('6. Craft Beer Tour in Bend'),
      paragraph('Bend has more breweries per capita than almost any city in America. Deschutes Brewery, Boneyard Beer, Crux Fermentation Project, and 10 Barrel Brewing are just the beginning. The Bend Ale Trail offers a passport program with over 30 participating breweries.'),
      heading('7. Hike the Cascade Lakes'),
      paragraph('The Cascade Lakes Highway west of Bend is a scenic corridor lined with alpine lakes, trailheads, and volcanic landscapes. Todd Lake, Green Lakes, and Sparks Lake are popular summer destinations. Fall brings stunning larch colors and fewer crowds.'),
      heading('8. Attend the Bend Film Festival'),
      paragraph('Held every October, the Bend Film Festival draws independent filmmakers from around the world. Screenings take place across multiple venues in downtown Bend, and the festival has become one of the premier indie film events in the West.'),
      heading('9. Stroll Through Sisters'),
      paragraph('The town of Sisters combines western charm with modern creativity. The main street is lined with galleries, boutiques, and restaurants. The annual Sisters Outdoor Quilt Show in July is the largest outdoor quilt show in the world, drawing over 10,000 visitors.'),
      heading('10. Paddleboard on Elk Lake'),
      paragraph('Elk Lake, about 30 minutes west of Bend, offers crystal-clear water and Cascade peak views that rival any mountain lake in the country. Stand-up paddleboarding, kayaking, and canoeing are popular from June through September. Elk Lake Resort rents gear if you do not have your own.'),
      heading('11. Explore Newberry Volcanic Monument'),
      paragraph('Just south of Bend, Newberry National Volcanic Monument features obsidian flows, crater lakes, and volcanic landscapes. Paulina Falls is an easy hike to a dramatic waterfall, and the Big Obsidian Flow trail crosses a massive field of volcanic glass.'),
      heading('12. Catch a Concert at Les Schwab Amphitheater'),
      paragraph('Bend\'s premier outdoor concert venue sits along the Deschutes River in the Old Mill District. The summer concert series brings national acts to an intimate riverside setting. Grab dinner at one of the nearby restaurants before the show.'),
      heading('13. Winter Snowshoeing and Cross-Country Skiing'),
      paragraph('When the snow falls, Central Oregon transforms into a winter playground beyond the ski resort. Virginia Meissner Sno-Park, Swampy Lakes, and Edison Butte offer groomed cross-country ski trails and snowshoe routes through beautiful ponderosa forests.'),
      heading('14. Farmers Markets'),
      paragraph('The Bend Farmers Market runs every Wednesday from May through October in downtown Bend. NorthWest Crossing hosts a Saturday market. Redmond has its own farmers market on Saturdays. Local produce, artisan goods, and live music make these community gathering spots.'),
      heading('15. Sunset at Pilot Butte'),
      paragraph('Pilot Butte is a cinder cone in the middle of Bend that offers 360-degree views of the Cascades, the city, and the high desert. Drive or hike to the top for one of the best sunsets in Oregon. It is the only state park located entirely within a city\'s limits.'),
      paragraph('Central Oregon has something for everyone, in every season. If you are looking for a rental in this incredible region, High Desert Property Management has listings across Bend, Redmond, Sisters, Prineville, Madras, and beyond. Check our availability page or contact us to find your next home.'),
    ]),
  },
]

// ─── Main seed function ─────────────────────────────────────────────
async function seed() {
  console.log('🌱 Starting HDPM blog seed...\n')

  const payload = await getPayload({ config })

  // 1. Create categories
  console.log('📁 Creating categories...')
  const categoryMap: Record<string, number> = {}
  for (const cat of CATEGORIES) {
    const existing = await payload.find({
      collection: 'categories',
      where: { slug: { equals: cat.slug } },
      limit: 1,
    })
    if (existing.docs.length > 0) {
      categoryMap[cat.slug] = existing.docs[0].id
      console.log(`  ✓ ${cat.name} (exists)`)
    } else {
      const created = await payload.create({
        collection: 'categories',
        data: cat,
      })
      categoryMap[cat.slug] = created.id
      console.log(`  + ${cat.name}`)
    }
  }

  // 2. Download and upload images
  console.log('\n📸 Downloading and uploading images...')
  const mediaMap: Record<number, number> = {}
  for (let i = 0; i < IMAGES.length; i++) {
    const img = IMAGES[i]
    try {
      const filePath = await downloadImage(img)

      // Check if media already exists
      const existing = await payload.find({
        collection: 'media',
        where: { alt: { equals: img.alt } },
        limit: 1,
      })

      if (existing.docs.length > 0) {
        mediaMap[i] = existing.docs[0].id
        console.log(`  ✓ ${img.id} media (exists)`)
      } else {
        const fileBuffer = fs.readFileSync(filePath)
        const created = await payload.create({
          collection: 'media',
          data: {
            alt: img.alt,
            caption: `Photo from Unsplash — Central Oregon`,
          },
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
    const existing = await payload.find({
      collection: 'posts',
      where: { slug: { equals: post.slug } },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`  ✓ "${post.title}" (exists)`)
      continue
    }

    const data: Record<string, unknown> = {
      title: post.title,
      slug: post.slug,
      status: 'published' as const,
      publishedAt: post.publishedAt,
      author: post.author,
      categories: categoryMap[post.categorySlug] ? [categoryMap[post.categorySlug]] : [],
      tags: post.tags.map((tag) => ({ tag })),
      body: post.body,
      seoTitle: post.seoTitle,
      seoDescription: post.seoDescription,
    }

    if (mediaMap[post.imageIndex] !== undefined) {
      data.featuredImage = mediaMap[post.imageIndex]
    }

    await payload.create({
      collection: 'posts',
      data: data as never,
    })
    console.log(`  + "${post.title}"`)
  }

  // Cleanup tmp images
  const tmpDir = path.join(__dirname, '../tmp-images')
  if (fs.existsSync(tmpDir)) {
    fs.rmSync(tmpDir, { recursive: true })
    console.log('\n🧹 Cleaned up temporary images')
  }

  console.log('\n✅ Blog seed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
