import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
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

interface TopicSuggestion {
  title: string
  angle: string
  audience: 'owners' | 'tenants' | 'both'
  source: string
  sourceUrl?: string
  relevance: string
  upvotes?: number
  comments?: number
}

/* ------------------------------------------------------------------ */
/*  Reddit search                                                      */
/* ------------------------------------------------------------------ */

const SUBREDDITS = [
  'Landlord',
  'TenantHelp',
  'realestateinvesting',
  'PropertyManagement',
  'RentalInvesting',
  'oregon',
  'Bend',
]

const SEARCH_QUERIES = [
  'property management',
  'landlord tips',
  'tenant rights oregon',
  'rental property maintenance',
  'rental market 2026',
  'property manager worth it',
  'central oregon rent',
  'bend oregon housing',
  'rental investment',
  'tenant screening',
  'pet policy rental',
  'lease renewal',
  'property maintenance winter',
  'wildfire rental property',
]

async function searchReddit(query: string, subreddit?: string): Promise<RedditPost[]> {
  const base = subreddit
    ? `https://www.reddit.com/r/${subreddit}/search.json`
    : 'https://www.reddit.com/search.json'

  const params = new URLSearchParams({
    q: query,
    sort: 'relevance',
    t: 'month',
    limit: '10',
    restrict_sr: subreddit ? 'true' : 'false',
  })

  try {
    const res = await fetch(`${base}?${params}`, {
      headers: { 'User-Agent': 'HDPM-BlogResearch/1.0' },
    })
    if (!res.ok) return []
    const data: RedditListing = await res.json()
    return data?.data?.children ?? []
  } catch {
    return []
  }
}

async function getSubredditHot(subreddit: string): Promise<RedditPost[]> {
  try {
    const res = await fetch(
      `https://www.reddit.com/r/${subreddit}/hot.json?limit=15`,
      { headers: { 'User-Agent': 'HDPM-BlogResearch/1.0' } },
    )
    if (!res.ok) return []
    const data: RedditListing = await res.json()
    return data?.data?.children ?? []
  } catch {
    return []
  }
}

/* ------------------------------------------------------------------ */
/*  Analysis helpers                                                   */
/* ------------------------------------------------------------------ */

function classifyAudience(text: string): 'owners' | 'tenants' | 'both' {
  const lower = text.toLowerCase()
  const ownerTerms = ['landlord', 'owner', 'investment', 'roi', 'vacancy', 'property manager', 'rent collection', 'depreciation', 'cash flow']
  const tenantTerms = ['tenant', 'renter', 'lease', 'security deposit', 'maintenance request', 'move-in', 'application', 'rent increase']

  const ownerScore = ownerTerms.filter((t) => lower.includes(t)).length
  const tenantScore = tenantTerms.filter((t) => lower.includes(t)).length

  if (ownerScore > tenantScore) return 'owners'
  if (tenantScore > ownerScore) return 'tenants'
  return 'both'
}

function isRelevant(post: RedditPost): boolean {
  const text = `${post.data.title} ${post.data.selftext}`.toLowerCase()
  const keywords = [
    'property', 'rental', 'landlord', 'tenant', 'rent', 'lease',
    'maintenance', 'screen', 'evict', 'deposit', 'manage', 'invest',
    'vacancy', 'oregon', 'bend', 'central oregon', 'pet', 'snow',
    'wildfire', 'winter', 'mountain', 'housing',
  ]
  return keywords.filter((k) => text.includes(k)).length >= 2
}

function generateAngle(title: string, subreddit: string): string {
  const lower = title.toLowerCase()

  if (lower.includes('?')) {
    return 'Answer this common question with Central Oregon-specific expertise'
  }
  if (lower.includes('tip') || lower.includes('advice')) {
    return 'Share HDPM\'s professional take with local market context'
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
/*  Route handler                                                      */
/* ------------------------------------------------------------------ */

/**
 * POST /api/automations/blog-research
 *
 * Researches Reddit and other sources for trending property management
 * topics relevant to Central Oregon owners and tenants.
 *
 * Body (optional):
 *   { focus?: 'owners' | 'tenants' | 'both' }
 */
export async function POST(request: Request) {
  // Auth check
  const headersList = await headers()
  const cookie = headersList.get('cookie') || ''
  if (!cookie.includes('payload-token')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let focus: 'owners' | 'tenants' | 'both' = 'both'
  try {
    const body = await request.json()
    if (body.focus) focus = body.focus
  } catch {
    // No body or invalid JSON — use default
  }

  const allTopics: TopicSuggestion[] = []

  // 1. Search key subreddits for hot posts
  const hotPromises = ['Landlord', 'PropertyManagement', 'TenantHelp', 'realestateinvesting'].map(
    (sub) => getSubredditHot(sub),
  )
  const hotResults = await Promise.all(hotPromises)

  for (const posts of hotResults) {
    for (const post of posts) {
      if (!isRelevant(post)) continue
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

  // 2. Search for Central Oregon-specific topics
  const localQueries = [
    'central oregon rental',
    'bend oregon housing',
    'oregon landlord tenant law',
    'oregon rental market',
  ]

  for (const query of localQueries) {
    // Small delay to avoid Reddit rate limiting
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

  // 3. Search for seasonal/timely topics
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

  // Deduplicate and sort by engagement
  const unique = deduplicateTopics(allTopics)
  unique.sort((a, b) => ((b.upvotes ?? 0) + (b.comments ?? 0) * 3) - ((a.upvotes ?? 0) + (a.comments ?? 0) * 3))

  // Take top 20
  const topTopics = unique.slice(0, 20)

  // Generate summary stats
  const ownerTopics = topTopics.filter((t) => t.audience === 'owners' || t.audience === 'both').length
  const tenantTopics = topTopics.filter((t) => t.audience === 'tenants' || t.audience === 'both').length
  const sources = [...new Set(topTopics.map((t) => t.source))]

  return NextResponse.json({
    message: `Found ${topTopics.length} blog topic suggestions`,
    focus,
    stats: {
      totalFound: unique.length,
      returned: topTopics.length,
      ownerRelevant: ownerTopics,
      tenantRelevant: tenantTopics,
      sourcesSearched: sources,
    },
    topics: topTopics,
    searchedAt: new Date().toISOString(),
  })
}
