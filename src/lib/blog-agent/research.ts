/**
 * Blog topic research: mines Reddit discussions and Tavily web search for
 * property-management topics relevant to Central Oregon owners and tenants.
 * Shared by the admin "Blog Topic Research" button and the blog-agent cron.
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

/**
 * App-only OAuth token when REDDIT_CLIENT_ID/SECRET are configured — much
 * higher rate limits than the anonymous JSON endpoints. Falls back to null
 * (anonymous access) on any failure.
 */
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

export async function searchReddit(query: string, subreddit?: string): Promise<RedditPost[]> {
  const path = subreddit ? `/r/${subreddit}/search.json` : '/search.json'
  return redditGet(
    path,
    new URLSearchParams({
      q: query,
      sort: 'relevance',
      t: 'month',
      limit: '10',
      restrict_sr: subreddit ? 'true' : 'false',
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
  const ownerTerms = ['landlord', 'owner', 'investment', 'roi', 'vacancy', 'property manager', 'rent collection', 'depreciation', 'cash flow']
  const tenantTerms = ['tenant', 'renter', 'lease', 'security deposit', 'maintenance request', 'move-in', 'application', 'rent increase']

  const ownerScore = ownerTerms.filter((t) => lower.includes(t)).length
  const tenantScore = tenantTerms.filter((t) => lower.includes(t)).length

  if (ownerScore > tenantScore) return 'owners'
  if (tenantScore > ownerScore) return 'tenants'
  return 'both'
}

function isRelevant(text: string): boolean {
  const lower = text.toLowerCase()
  const keywords = [
    'property', 'rental', 'landlord', 'tenant', 'rent', 'lease',
    'maintenance', 'screen', 'evict', 'deposit', 'manage', 'invest',
    'vacancy', 'oregon', 'bend', 'central oregon', 'pet', 'snow',
    'wildfire', 'winter', 'mountain', 'housing',
  ]
  return keywords.filter((k) => lower.includes(k)).length >= 2
}

function generateAngle(title: string, subreddit: string): string {
  const lower = title.toLowerCase()

  if (lower.includes('?')) {
    return 'Answer this common question with Central Oregon-specific expertise'
  }
  if (lower.includes('tip') || lower.includes('advice')) {
    return "Share HDPM's professional take with local market context"
  }
  if (lower.includes('mistake') || lower.includes('wrong') || lower.includes('regret')) {
    return 'Write a "how to avoid this" guide with real examples'
  }
  if (lower.includes('cost') || lower.includes('price') || lower.includes('worth')) {
    return 'Provide Central Oregon-specific cost data and market comparison'
  }
  if (subreddit.toLowerCase() === 'oregon' || subreddit.toLowerCase() === 'bend') {
    return 'Localize with Central Oregon market data and community knowledge'
  }
  return 'Adapt this trending discussion into actionable advice for Central Oregon'
}

function deduplicateTopics(topics: TopicSuggestion[]): TopicSuggestion[] {
  const seen = new Set<string>()
  return topics.filter((t) => {
    const key = t.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/* ------------------------------------------------------------------ */
/*  Main research pipeline                                             */
/* ------------------------------------------------------------------ */

export async function researchTopics(focus: ResearchFocus = 'both'): Promise<{
  topics: TopicSuggestion[]
  totalFound: number
  sourcesSearched: string[]
}> {
  const allTopics: TopicSuggestion[] = []

  // 1. Hot posts from key subreddits
  const hotResults = await Promise.all(
    ['Landlord', 'PropertyManagement', 'TenantHelp', 'realestateinvesting'].map((sub) =>
      getSubredditHot(sub),
    ),
  )

  for (const posts of hotResults) {
    for (const post of posts) {
      if (!isRelevant(`${post.data.title} ${post.data.selftext}`)) continue
      if (post.data.score < 5) continue

      const audience = classifyAudience(`${post.data.title} ${post.data.selftext}`)
      if (focus !== 'both' && audience !== focus && audience !== 'both') continue

      allTopics.push({
        title: post.data.title,
        angle: generateAngle(post.data.title, post.data.subreddit),
        audience,
        source: `r/${post.data.subreddit}`,
        sourceUrl: `https://reddit.com${post.data.permalink}`,
        relevance: 'Trending discussion with high engagement',
        upvotes: post.data.score,
        comments: post.data.num_comments,
      })
    }
  }

  // 2. Central Oregon-specific Reddit searches
  const localQueries = [
    'central oregon rental',
    'bend oregon housing',
    'oregon landlord tenant law',
    'oregon rental market',
  ]

  for (const query of localQueries) {
    await new Promise((r) => setTimeout(r, 300))
    const posts = await searchReddit(query)
    for (const post of posts) {
      if (post.data.score < 3) continue

      const audience = classifyAudience(`${post.data.title} ${post.data.selftext}`)
      if (focus !== 'both' && audience !== focus && audience !== 'both') continue

      allTopics.push({
        title: post.data.title,
        angle: 'Local relevance — directly applicable to Central Oregon market',
        audience,
        source: `r/${post.data.subreddit}`,
        sourceUrl: `https://reddit.com${post.data.permalink}`,
        relevance: 'Central Oregon / Oregon specific',
        upvotes: post.data.score,
        comments: post.data.num_comments,
      })
    }
  }

  // 3. Seasonal Reddit searches
  const month = new Date().toLocaleString('en-US', { month: 'long' }).toLowerCase()
  const seasonalQueries = [
    `${month} rental property`,
    `${month} landlord`,
    'seasonal property maintenance',
  ]

  for (const query of seasonalQueries) {
    await new Promise((r) => setTimeout(r, 300))
    const posts = await searchReddit(query)
    for (const post of posts) {
      if (post.data.score < 3) continue

      allTopics.push({
        title: post.data.title,
        angle: 'Timely/seasonal — publish soon for maximum relevance',
        audience: classifyAudience(`${post.data.title} ${post.data.selftext}`),
        source: `r/${post.data.subreddit}`,
        sourceUrl: `https://reddit.com${post.data.permalink}`,
        relevance: 'Seasonal / timely topic',
        upvotes: post.data.score,
        comments: post.data.num_comments,
      })
    }
  }

  // 4. Tavily web search — industry trends and Oregon-specific news
  const tavilyQueries = [
    'property management trends landlords',
    `central oregon bend rental market ${new Date().getFullYear()}`,
    'oregon landlord tenant law changes',
    `${month} rental property maintenance checklist`,
  ]

  for (const query of tavilyQueries) {
    const results = await searchTavily(query)
    for (const r of results) {
      if (!isRelevant(`${r.title} ${r.content}`)) continue

      const audience = classifyAudience(`${r.title} ${r.content}`)
      if (focus !== 'both' && audience !== focus && audience !== 'both') continue

      let host = 'web'
      try {
        host = new URL(r.url).hostname.replace(/^www\./, '')
      } catch {
        // keep generic label
      }

      allTopics.push({
        title: r.title,
        angle: 'Cover this industry topic with a Central Oregon lens',
        audience,
        source: host,
        sourceUrl: r.url,
        relevance: 'Web research (Tavily)',
        // Scale Tavily's 0-1 relevance score into the same rough range as
        // Reddit upvotes so mixed-source sorting stays meaningful.
        upvotes: Math.round(r.score * 40),
      })
    }
  }

  const unique = deduplicateTopics(allTopics)
  unique.sort(
    (a, b) => ((b.upvotes ?? 0) + (b.comments ?? 0) * 3) - ((a.upvotes ?? 0) + (a.comments ?? 0) * 3),
  )

  return {
    topics: unique.slice(0, 20),
    totalFound: unique.length,
    sourcesSearched: [...new Set(unique.slice(0, 20).map((t) => t.source))],
  }
}
