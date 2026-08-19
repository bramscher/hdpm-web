import { NextRequest, NextResponse } from 'next/server'
import { runListingsSync } from '@/lib/sync-listings'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — large dataset

const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/cron/sync-listings
 *
 * Scheduled entry point (Vercel cron) for the AppFolio -> Supabase listing sync.
 * Protected by CRON_SECRET header check. The actual work lives in
 * runListingsSync() so the admin automations route can invoke it in-process.
 *
 * Pass ?fresh=1 to bypass the 15-minute ISR cache and force a genuine re-pull.
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const forceFresh = ['1', 'true'].includes(
    (request.nextUrl.searchParams.get('fresh') || '').toLowerCase(),
  )

  try {
    const result = await runListingsSync(forceFresh)
    return NextResponse.json(result)
  } catch (err) {
    console.error('[sync-listings] Sync failed:', err)
    return NextResponse.json(
      { error: 'Sync failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
