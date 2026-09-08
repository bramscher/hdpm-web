import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { refreshFeaturedImages } from '@/lib/blog-agent/backfill-images'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/automations/backfill-images
 *
 * Admin-triggered (re)assignment of blog featured images from Unsplash.
 * Body: { onlyMissing?: boolean } — default false (refresh every post).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  let onlyMissing = false
  try {
    const body = await req.json()
    onlyMissing = !!body?.onlyMissing
  } catch {
    // no body — default to refreshing all
  }

  try {
    const result = await refreshFeaturedImages(onlyMissing)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[automations/backfill-images] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
