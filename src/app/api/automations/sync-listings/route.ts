import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'
import { runListingsSync } from '@/lib/sync-listings'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes — large dataset

/**
 * POST /api/automations/sync-listings
 *
 * Admin-triggered "Refresh from AppFolio". Runs the sync in-process (no internal
 * HTTP call to the cron endpoint, so no CRON_SECRET handshake that can fail
 * behind a www redirect or a trailing-newline secret). Always forces a fresh
 * pull so a corrected/added photo shows up immediately.
 */
export async function POST() {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  try {
    const result = await runListingsSync(true)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json(
      { error: 'Sync failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
