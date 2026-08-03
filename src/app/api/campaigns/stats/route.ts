import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAuth } from '@/lib/api-auth'
import { SITE_URL } from '@/lib/site-url'
import type { LandingPage } from '@/payload-types'

export const dynamic = 'force-dynamic'

export interface CampaignStats {
  id: number
  name: string
  slug: string
  platform: string
  status: string
  landingPage: { title: string; slug: string; status: string } | null
  adUrl: string | null
  visits: number
  visits30d: number
  leads: number
  leads30d: number
  conversionRate: number | null
}

/**
 * GET /api/campaigns/stats
 *
 * Per-campaign measurement for the Campaigns dashboard: landing-page visits
 * (from the beacon), leads attributed by utm_campaign, conversion rate, and
 * the copy-ready ad URL for Ads Manager.
 */
export async function GET() {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const payload = await getPayload({ config })
  const { docs: campaigns } = await payload.find({
    collection: 'campaigns',
    limit: 100,
    depth: 1,
    sort: '-createdAt',
  })

  const cutoff30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const stats: CampaignStats[] = await Promise.all(
    campaigns.map(async (c) => {
      const lp = (c.landingPage as LandingPage | null) ?? null

      const [visits, visits30d, leads, leads30d] = await Promise.all([
        payload.count({
          collection: 'campaign-visits',
          where: { campaign: { equals: c.id } },
        }),
        payload.count({
          collection: 'campaign-visits',
          where: { campaign: { equals: c.id }, createdAt: { greater_than: cutoff30 } },
        }),
        payload.count({
          collection: 'leads',
          where: { 'attribution.utmCampaign': { equals: c.slug } },
        }),
        payload.count({
          collection: 'leads',
          where: {
            'attribution.utmCampaign': { equals: c.slug },
            createdAt: { greater_than: cutoff30 },
          },
        }),
      ])

      const adUrl = lp
        ? `${SITE_URL}/lp/${lp.slug}?${new URLSearchParams({
            utm_source: c.platform,
            utm_medium: c.utmMedium || 'paid_social',
            utm_campaign: c.slug,
          })}`
        : null

      return {
        id: c.id,
        name: c.name,
        slug: c.slug,
        platform: c.platform,
        status: c.status,
        landingPage: lp ? { title: lp.title, slug: lp.slug, status: lp.status } : null,
        adUrl,
        visits: visits.totalDocs,
        visits30d: visits30d.totalDocs,
        leads: leads.totalDocs,
        leads30d: leads30d.totalDocs,
        conversionRate:
          visits.totalDocs > 0
            ? Math.round((leads.totalDocs / visits.totalDocs) * 1000) / 10
            : null,
      }
    }),
  )

  return NextResponse.json({ campaigns: stats, generatedAt: new Date().toISOString() })
}
