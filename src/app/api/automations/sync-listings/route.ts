import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

const CRON_SECRET = process.env.CRON_SECRET
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

/**
 * POST /api/automations/sync-listings
 *
 * Admin-only proxy that calls the cron sync-listings endpoint
 * with the CRON_SECRET, so the admin UI doesn't need to know it.
 */
export async function POST() {
  // Basic check: only allow from admin (cookie-based auth)
  const headersList = await headers()
  const cookie = headersList.get('cookie') || ''
  if (!cookie.includes('payload-token')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!CRON_SECRET) {
    return NextResponse.json(
      { error: 'CRON_SECRET not configured' },
      { status: 500 },
    )
  }

  try {
    const res = await fetch(`${BASE_URL}/api/cron/sync-listings`, {
      headers: { Authorization: `Bearer ${CRON_SECRET}` },
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
