import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { applyCuratedBlogImages } from '@/lib/blog-agent/backfill-images'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/automations/apply-curated-images
 *
 * Applies the hand-curated featured images (curated-blog-images.ts) to their
 * posts. One-off recovery action.
 */
export async function POST() {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await applyCuratedBlogImages()
    return NextResponse.json(result)
  } catch (err) {
    console.error('[automations/apply-curated-images] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
