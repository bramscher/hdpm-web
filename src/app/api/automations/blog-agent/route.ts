import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { runBlogAgent } from '@/lib/blog-agent/run'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/automations/blog-agent
 *
 * Admin-triggered run of the full blog-agent pipeline (research → draft →
 * featured image → digest email). Same pipeline the twice-weekly cron runs.
 */
export async function POST() {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await runBlogAgent()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[automations/blog-agent] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
