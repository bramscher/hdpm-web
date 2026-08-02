import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { researchTopics, type ResearchFocus } from '@/lib/blog-agent/research'

/**
 * POST /api/automations/blog-research
 *
 * Researches Reddit and the web (Tavily) for trending property management
 * topics relevant to Central Oregon owners and tenants.
 *
 * Body (optional):
 *   { focus?: 'owners' | 'tenants' | 'both' }
 */
export async function POST(request: Request) {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let focus: ResearchFocus = 'both'
  try {
    const body = await request.json()
    if (body.focus) focus = body.focus
  } catch {
    // No body or invalid JSON — use default
  }

  const { topics, totalFound, sourcesSearched } = await researchTopics(focus)

  const ownerTopics = topics.filter((t) => t.audience === 'owners' || t.audience === 'both').length
  const tenantTopics = topics.filter((t) => t.audience === 'tenants' || t.audience === 'both').length

  return NextResponse.json({
    message: `Found ${topics.length} blog topic suggestions`,
    focus,
    stats: {
      totalFound,
      returned: topics.length,
      ownerRelevant: ownerTopics,
      tenantRelevant: tenantTopics,
      sourcesSearched,
    },
    topics,
    searchedAt: new Date().toISOString(),
  })
}
