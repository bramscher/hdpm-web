import { NextRequest, NextResponse } from 'next/server'
import { runBlogAgent } from '@/lib/blog-agent/run'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // research + generation + image import

const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/blog-agent
 *
 * Twice-weekly blog agent (see vercel.json): researches trending topics on
 * Reddit + Tavily, writes a draft post with Claude, attaches a license-safe
 * featured image, and emails the digest (draft link + social copy) to the
 * monitored inbox. Drafts only — a human publishes.
 *
 * Protected by CRON_SECRET header check.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await runBlogAgent()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[cron/blog-agent] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
