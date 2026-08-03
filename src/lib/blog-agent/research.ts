/**
 * Blog topic research: mines professional property-management communities
 * on Reddit plus Tavily web search for topics relevant to Central Oregon
 * owners and tenants. Shared by the admin "Blog Topic Research" button and
 * the blog-agent cron.
 *
 * Editorial guardrails (Craig, 2026-08-03):
 * - only whitelisted, on-topic subreddits — never site-wide Reddit search
 * - no grievance/conflict/personal-drama content, ever
 * - ranking favors professional relevance over raw engagement, so viral
 *   drama can't outrank useful industry topics
 */

export interface TopicSuggestion {
  title: string
  angle: string
  audience: 'owners' | 'tenants' | 'both'
  source: string
  sourceUrl?: string
  relevance: string
  upvotes?: number
  comments?: number
}

export type ResearchFocus = 'owners' | 'tenants' | 'both'

/**
 * Content we never write about: tenant complaints, landlord-vs-tenant
 * conflict, and personal/relationship drama. Shared with run.ts so the
 * cron applies the same rule.
 */
export const EXCLUDED_CONTENT =
  /\[\s*\d+\s*[mf]\s*\]|\(\s*\d+\s*[mf]\s*\)|aita|am i (the|a bad)|boyfriend|girlfriend|husband|my wife|flatmate|roommate|divorc|cheat|in love|break.?up|my (mom|dad|sister|brother|ex)|drama|complain|dispute|scam|illegal|lawsuit|sue[sd]?\b|evict|non.?renewal|refus|nightmare|horror|worst|slumlord|withhold|retaliat|confess|steal|stole|poach|fight|angry|furious|unfair|rights violat|revenge|toxic|screwed|ripped off|by the balls|went (bad|wrong)|set up to fail|fired|i quit|hate|awful|terrible|regret|beware|warning|red flag|difficult tenant|problem tenant|^welcome to|charg\w+ (me|us) for/i

/* ------------------------------------------------------------------ */
/*  Source configuration                                               */
/* ------------------------------------------------------------------ */

const OWNER_SUBS = ['Landlord', 'PropertyManagement', 'realestateinvesting', 'RealEstate', 'RentalInvesting']
const LOCAL_SUBS = ['Oregon', 'Bend', 'CentralOregon']
const SERVICE_SUBS = ['HomeMaintenance', 'HomeImprovement', 'Moving']

function subsForFocus(focus: ResearchFocus): string[] {
  if (focus === 'owners') return [...OWNER_SUBS, ...LOCAL_SUBS]
  if (focus === 'tenants') return [...SERVICE_SUBS, ...LOCAL_SUBS]
  return [...OWNER_SUBS, ...LOCAL_SUBS, ...SERVICE_SUBS]
}

/** Professional/on-topic vocabulary — drives both relevance gate and ranking. */
const PRO_TERMS = [
  'property management', 'property manager', 'landlord', 'rental property', 'rental market',
  'rent price', 'rent increase', 'lease', 'tenant screening', 'screening', 'vacancy',
  'maintenance', 'winteriz', 'inspection', 'invest', 'cash flow', 'cap rate', 'roi',
  'insurance', 'property tax', '1031', 'depreciation', 'renovation', 'turnover',
  'deposit', 'application', 'move-in', 'move out', 'furnace', 'hvac', 'roof',
  'landscap', 'snow', 'wildfire', 'irrigation', 'oregon', 'bend', 'redmond',
  'central oregon', 'housing market', 'home value', 'appraisal', 'zoning', 'str',
  'short term rental', 'long term rental', 'duplex', 'multifamily',
]

function proScore(text: string): number {
  const lower = text.toLowerCase()
  return PRO_TERMS.filter((t) => lower.includes(t)).length
}

/* ------------------------------------------------------------------ */
/*  Reddit                                                             */
/* ------------------------------------------------------------------ */

interface RedditPost {
  data: {
    title: string
    selftext: string
    score: number
    num_comments: number
    permalink: string
    created_utc: number
    subreddit: string
  }
}

interface RedditListing {
  data: {
    children: RedditPost[]
  }
}

const REDDIT_UA = 'HDPM-BlogResearch/1.0 (info@highdesertpm.com)'

let redditToken: { token: string; expiresAt: number } | null = null

async function getRedditToken(): Promise<string | null> {
  const id = process.env.REDDIT_CLIENT_ID
  const secret = process.env.REDDIT_CLIENT_SECRET
  if (!id || !secret) return null
  if (redditToken && redditToken.expiresAt > Date.now() + 60_000) {
    return redditToken.token
  }
  try {
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': REDDIT_UA,
      },
      body: 'grant_type=client_credentials',
    })
    if (!res.ok) return null
    const data = (await res.json()) as { access_token?: string; expires_in?: number }
    if (!data.access_token) return null
    redditToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
    }
    return redditToken.token
  } catch {
    return null
  }
}

async function redditGet(path: string, params: URLSearchParams): Promise<RedditPost[]> {
  const token = await getRedditToken()
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com'
  const suffix = token ? path.replace(/\.json$/, '') : path
  try {
    const res = await fetch(`${base}${suffix}?${params}`, {
      headers: {
        'User-Agent': REDDIT_UA,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    })
    if (!res.ok) return []
    const data: RedditListing = await res.json()
    return data?.data?.children ?? []
  } catch {
    return []
  }
}

/** Search restricted to one whitelisted subreddit — never site-wide. */
export async function searchReddit(query: string, subreddit: string): Promise<RedditPost[]> {
  return redditGet(
    `/r/${subreddit}/search.json`,
    new URLSearchParams({
      q: query,
      sort: 'relevance',
      t: 'month',
      limit: '10',
      restrict_sr: 'true',
    }),
  )
}

export async function getSubredditHot(subreddit: string): Promise<RedditPost[]> {
  return redditGet(`/r/${subreddit}/hot.json`, new URLSearchParams({ limit: '15' }))
}

/* ------------------------------------------------------------------ */
/*  Tavily web search                                                  */
/* ------------------------------------------------------------------ */

interface TavilyResult {
  title: string
  url: string
  content: string
  score: number
}

async function searchTavily(query: string): Promise<TavilyResult[]> {
  const key = process.env.TAVILY_API_KEY
  if (!key) return []
  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        search_depth: 'basic',
        max_results: 6,
        include_answer: false,
      }),
    })
    if (!res.ok) return []
    const data = (await res.json()) as { results?: TavilyResult[] }
    return data.results ?? []
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Analysis helpers                                                   */
/* ------------------------------------------------------------------ */

export function classifyAudience(text: string): 'owners' | 'tenants' | 'both' {
  const lower = text.toLowerCase()
  const ownerTerms = ['landlord', 'owner', 'investment', 'invest', 'roi', 'cash flow', 'cap rate', 'vacancy', 'property manager', 'property management', 'rent collection', 'depreciation', 'screening', '1031', 'multifamily']
  const tenantTerms = ['renter', 'my apartment', 'my rental', 'move-in', 'moving to', 'application']

  const ownerScore = ownerTerms.filter((t) => lower.includes(t)).length
  const tenantScore = tenantTerms.filter((t) => lower.includes(t)).length

  if (ownerScore > tenantScore) return 'owners'
  if (tenantScore > ownerScore) return 'tenants'
  return 'both'
}

function generateAngle(title: string, subreddit: string): string {
  const lower = title.toLowerCase()

  if (lower.includes('?')) {
    return 'Answer this common question with Central Oregon-specific expertise'
  }
  if (lower.includes('tip') || lower.includes('advice') || lower.includes('checklist')) {
    return "Share HDPM's professional take with local market context"
  }
  if (lower.includes('cost') || lower.includes('price') || lower.includes('worth') || lower.includes('market')) {
    return 'Provide Central Oregon-specific data and market comparison'
  }
  if (LOCAL_SUBS.some((s) => s.toLowerCase() === subreddit.toLowerCase())) {
    return 'Localize with Central Oregon market data and community knowledge'
  }
  return 'Adapt this industry discussion into actionable guidance for Central Oregon owners'
}

function deduplicateTopics(topics: (TopicSuggestion & { _score: number })[]) {
  const seen = new Set<string>()
  return topics.filter((t) => {
    const key = t.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Relevance-first ranking: professional-topic matches dominate; engagement
 * is log-dampened so a 5k-upvote viral thread can't outrank a genuinely
 * on-topic discussion.
 */
function rank(title: string, body: string, upvotes: number, comments: number): number {
  const relevance = proScore(`${title} ${body}`)
  const engagement = Math.log10(upvotes + 1) * 6 + Math.log10(comments + 1) * 4
  return relevance * 25 + engagement
}

interface Candidate {
  title: string
  body: string
  subreddit: string
  upvotes: number
  comments: number
  permalink: string
  relevanceLabel: string
  angleOverride?: string
}

function acceptCandidate(c: Candidate, focus: ResearchFocus): (TopicSuggestion & { _score: number }) | null {
  const text = `${c.title} ${c.body.slice(0, 400)}`
  if (EXCLUDED_CONTENT.test(text)) return null
  if (c.title.length > 110) return null // story posts, not topics
  if (proScore(text) < 2) return null // must be clearly on-topic

  const audience = classifyAudience(text)
  if (focus === 'owners' && audience === 'tenants') return null
  if (focus === 'tenants' && audience === 'owners') return null

  return {
    title: c.title,
    angle: c.angleOverride ?? generateAngle(c.title, c.subreddit),
    audience,
    source: `r/${c.subreddit}`,
    sourceUrl: `https://reddit.com${c.permalink}`,
    relevance: c.relevanceLabel,
    upvotes: c.upvotes,
    comments: c.comments,
    _score: rank(c.title, c.body, c.upvotes, c.comments),
  }
}

/* ------------------------------------------------------------------ */
/*  Main research pipeline                                             */
/* ------------------------------------------------------------------ */

export async function researchTopics(focus: ResearchFocus = 'both'): Promise<{
  topics: TopicSuggestion[]
  totalFound: number
  sourcesSearched: string[]
}> {
  const scored: (TopicSuggestion & { _score: number })[] = []
  const subs = subsForFocus(focus)
  const allowed = new Set(subs.map((s) => s.toLowerCase()))

  // 1. Hot posts from the whitelisted subreddits
  const hotResults = await Promise.all(subs.map((sub) => getSubredditHot(sub)))
  for (const posts of hotResults) {
    for (const post of posts) {
      if (!allowed.has(post.data.subreddit.toLowerCase())) continue
      if (post.data.score < 5) continue
      const item = acceptCandidate(
        {
          title: post.data.title,
          body: post.data.selftext,
          subreddit: post.data.subreddit,
          upvotes: post.data.score,
          comments: post.data.num_comments,
          permalink: post.data.permalink,
          relevanceLabel: 'Active discussion in a professional community',
        },
        focus,
      )
      if (item) scored.push(item)
    }
  }

  // 2. Targeted searches inside professional subs (never site-wide)
  const searchQueries =
    focus === 'tenants'
      ? ['moving checklist', 'winter home maintenance', 'renting first home']
      : [
          'rental market 2026',
          'property management worth it',
          'tenant screening best practices',
          'rental property maintenance seasonal',
          'oregon rental market',
        ]

  for (const query of searchQueries) {
    for (const sub of subs.slice(0, 5)) {
      await new Promise((r) => setTimeout(r, 200))
      const posts = await searchReddit(query, sub)
      for (const post of posts.slice(0, 5)) {
        if (post.data.score < 3) continue
        const item = acceptCandidate(
          {
            title: post.data.title,
            body: post.data.selftext,
            subreddit: post.data.subreddit,
            upvotes: post.data.score,
            comments: post.data.num_comments,
            permalink: post.data.permalink,
            relevanceLabel: 'Professional community search match',
          },
          focus,
        )
        if (item) scored.push(item)
      }
    }
  }

  // 3. Tavily web search — industry publications and Oregon news. These are
  //    professionally written, so they get a ranking boost over forum posts.
  const month = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase()
  const tavilyQueries = [
    'property management industry trends landlords',
    `central oregon bend redmond rental market ${new Date().getFullYear()}`,
    'oregon landlord rental law update',
    `${month} rental property maintenance checklist`,
  ]

  for (const query of tavilyQueries) {
    const results = await searchTavily(query)
    for (const r of results) {
      const text = `${r.title} ${r.content.slice(0, 400)}`
      if (EXCLUDED_CONTENT.test(text)) continue
      if (r.title.length > 110) continue
      if (proScore(text) < 2) continue

      const audience = classifyAudience(text)
      if (focus === 'owners' && audience === 'tenants') continue
      if (focus === 'tenants' && audience === 'owners') continue

      let host = 'web'
      try {
        host = new URL(r.url).hostname.replace(/^www\./, '')
      } catch {
        // keep generic label
      }

      scored.push({
        title: r.title,
        angle: 'Cover this industry topic with a Central Oregon lens',
        audience,
        source: host,
        sourceUrl: r.url,
        relevance: 'Industry publication (Tavily)',
        _score: proScore(text) * 25 + 20, // publication bonus in lieu of upvotes
      })
    }
  }

  const unique = deduplicateTopics(scored)
  unique.sort((a, b) => b._score - a._score)

  const topics = unique.slice(0, 20).map(({ _score, ...t }) => {
    void _score
    return t
  })

  return {
    topics,
    totalFound: unique.length,
    sourcesSearched: [...new Set(topics.map((t) => t.source))],
  }
}
