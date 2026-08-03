import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export const dynamic = 'force-dynamic'

/**
 * POST /api/campaigns/track
 *
 * Public visit beacon fired by ad landing pages when the URL carries a
 * utm_campaign. Records one campaign-visits row when the slug matches a
 * live (active or paused) campaign; silently ignores everything else, so
 * bots probing the endpoint can't fill the table.
 */
export async function POST(req: NextRequest) {
  let body: { campaign?: string; landingPath?: string; referrer?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const slug = String(body.campaign ?? '').replace(/[^a-z0-9-]/gi, '').slice(0, 80)
  if (!slug) return NextResponse.json({ ok: true })

  try {
    const payload = await getPayload({ config })
    const { docs } = await payload.find({
      collection: 'campaigns',
      where: { slug: { equals: slug }, status: { in: ['active', 'paused'] } },
      limit: 1,
      depth: 0,
    })
    if (docs.length === 0) return NextResponse.json({ ok: true })

    await payload.create({
      collection: 'campaign-visits',
      data: {
        campaign: docs[0].id,
        landingPath: String(body.landingPath ?? '').slice(0, 300) || undefined,
        referrer: String(body.referrer ?? '').slice(0, 300) || undefined,
      },
    })
  } catch (err) {
    console.warn('[campaigns/track] failed:', err)
  }

  return NextResponse.json({ ok: true })
}
