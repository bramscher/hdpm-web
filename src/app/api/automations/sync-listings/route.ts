import { NextResponse } from 'next/server'
import { requireAuth } from '@/lib/api-auth'

const CRON_SECRET = process.env.CRON_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * POST /api/automations/sync-listings
 *
 * Admin-only proxy that calls the cron sync-listings endpoint
 * with the CRON_SECRET, so the admin UI doesn't need to know it.
 */
export async function POST() {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    )
  }

  try {
    // fresh=1 → bypass the 15-minute ISR cache so the manual sync genuinely
    // re-pulls listings and photos from AppFolio (not a replayed cached response).
    const res = await fetch(`${BASE_URL}/api/cron/sync-listings?fresh=1`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
      cache: 'no-store',
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    return NextResponse.json(
      { error: 'Sync failed', details: String(err) },
      { status: 500 },
    )
  }
}
