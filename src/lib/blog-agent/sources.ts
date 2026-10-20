/**
 * Which sources the blog agent may build a post on (Craig, 2026-10-20).
 *
 * Drafts #54–57 were each a rewrite of one competitor or vendor blog post
 * (Velocity PM's market report, Buildium's industry report, Stanton's cash
 * flow post) or an out-of-state landlord's Reddit question. So:
 *
 * - web sources must be primary (government, public data, utilities) or
 *   established news; anything else — other property managers, brokerages,
 *   software vendors, SEO blogs — is never a source
 * - Reddit stays as a signal of what owners are asking, but only Oregon or
 *   state-neutral posts, never another state's rules
 */

export type SourceKind = 'primary' | 'news' | 'reddit' | 'other'

/** Government, public data and utility hosts. Subdomains count (e.g. olis.oregonlegislature.gov). */
export const PRIMARY_HOSTS = [
  'oregon.gov',
  'oregonlegislature.gov',
  'deschutes.org',
  'bendoregon.gov',
  'redmondoregon.gov',
  'ci.sisters.or.us',
  'cityofprineville.com',
  'ci.madras.or.us',
  'co.crook.or.us',
  'jeffco.net',
  'extension.oregonstate.edu',
  'hud.gov',
  'huduser.gov',
  'census.gov',
  'bls.gov',
  'fema.gov',
  'weather.gov',
  'noaa.gov',
  'epa.gov',
  'energy.gov',
  'irs.gov',
  'consumerfinance.gov',
  'federalreserve.gov',
  'pacificpower.net',
  'cngc.com',
]

/** Local and regional newsrooms plus wire services. */
export const NEWS_HOSTS = [
  'bendbulletin.com',
  'redmondspokesman.com',
  'ktvz.com',
  'centraloregondaily.com',
  'bendsource.com',
  'kbnd.com',
  'centraloregonian.com',
  'madraspioneer.com',
  'nuggetnews.com',
  'opb.org',
  'oregonlive.com',
  'oregoncapitalchronicle.com',
  'kgw.com',
  'koin.com',
  'apnews.com',
  'reuters.com',
]

/** Hosts Tavily may search (passed as include_domains). */
export const TRUSTED_WEB_HOSTS = [...PRIMARY_HOSTS, ...NEWS_HOSTS]

function hostOf(url: string | undefined): string {
  try {
    return new URL(url || '').hostname.replace(/^www\./, '').toLowerCase()
  } catch {
    return ''
  }
}

function matchesHost(host: string, list: string[]): boolean {
  return list.some((h) => host === h || host.endsWith(`.${h}`))
}

export function classifySource(url: string | undefined): SourceKind {
  const host = hostOf(url)
  if (!host) return 'other'
  if (host === 'reddit.com' || host.endsWith('.reddit.com')) return 'reddit'
  if (matchesHost(host, PRIMARY_HOSTS)) return 'primary'
  if (matchesHost(host, NEWS_HOSTS)) return 'news'
  return 'other'
}

/** True when a post may be built on this source. */
export function isAllowedSource(url: string | undefined): boolean {
  return classifySource(url) !== 'other'
}

const OTHER_STATES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee',
  'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
  'Canada', 'Ontario', 'British Columbia', 'Alberta', 'Quebec', 'England', 'Scotland',
  'Australia', 'New Zealand', 'Ireland',
]

const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 'HI', 'ID', 'IL', 'IN', 'IA',
  'KS', 'KY', 'LA', 'ME', 'MD', 'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'PA', 'RI', 'SC', 'SD', 'TN', 'TX', 'UT', 'VT', 'VA',
  'WA', 'WV', 'WI', 'WY', 'DC', 'UK', 'CAN', 'AUS', 'ON', 'BC',
]

const STATE_NAME_RE = new RegExp(`\\b(${OTHER_STATES.join('|')})\\b`, 'i')
// r/Landlord-style location tags: "[WA]", "(TX)", "Tenant/US-WA", "Landlord - CA".
const STATE_TAG_RE = new RegExp(
  `(?:\\[|\\(|US-|/\\s*|\\b(?:[Ll]andlord|[Tt]enant)\\s*[-–:]\\s*)(${STATE_CODES.join('|')})\\b`,
)
const OREGON_RE = /\b(oregon|bend|redmond|sisters|prineville|madras|culver|metolius|la pine|deschutes|crook county|jefferson county)\b|\[OR\]|US-OR\b/i

/**
 * True when a post is about somewhere other than Oregon. The title (where
 * Reddit location tags live) is checked strictly; the body only counts when it
 * names another place and never mentions Oregon.
 */
export function isOutOfState(title: string, body = ''): boolean {
  if (STATE_TAG_RE.test(title)) return true
  if (STATE_NAME_RE.test(title) && !OREGON_RE.test(title)) return true
  const opening = body.slice(0, 1500)
  return STATE_NAME_RE.test(opening) && !OREGON_RE.test(`${title} ${opening}`)
}
