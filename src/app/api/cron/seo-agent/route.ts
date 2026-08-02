import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import {
  gscConfigured,
  querySearchAnalytics,
  daysAgo,
  type GscRow,
} from '@/lib/seo-agent/gsc'
import {
  pickOpportunities,
  generateSuggestions,
  type PastExperiment,
} from '@/lib/seo-agent/analyze'
import { sendLeadNotification } from '@/lib/notify'
import { SITE_URL } from '@/lib/site-url'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const CRON_SECRET = process.env.CRON_SECRET

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

/**
 * GET /api/cron/seo-agent  (weekly)
 *
 * The self-improving SEO loop:
 *  1. Measure: for suggestions applied ≥28 days ago, pull post-change GSC
 *     metrics and record the outcome (improved / no_change / worse).
 *  2. Find: rank pages by opportunity (high impressions, weak CTR,
 *     striking-distance positions).
 *  3. Suggest: ask Claude for metadata improvements, informed by the page's
 *     past experiment outcomes; store as pending SeoSuggestions for review.
 *  4. Notify: email a digest of new suggestions.
 *
 * Protected by CRON_SECRET. No-ops with a clear message until GSC env vars
 * are configured (see src/lib/seo-agent/gsc.ts header).
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!gscConfigured()) {
    console.warn(
      '[seo-agent] GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY / GSC_SITE_URL not set — skipping run',
    )
    return NextResponse.json({ ok: true, skipped: 'gsc_not_configured' })
  }

  const payload: AnyPayload = await getPayload({ config })
  const endDate = daysAgo(3) // GSC data lags ~2 days
  const startDate = daysAgo(31)

  try {
    // ── 1. Measure past experiments ────────────────────────────────────
    const cutoff = new Date(Date.now() - 28 * 86400_000).toISOString()
    const applied = await payload.find({
      collection: 'seo-suggestions',
      where: {
        status: { equals: 'applied' },
        appliedAt: { less_than: cutoff },
        outcome: { exists: false },
      },
      limit: 20,
    })
    let measured = 0
    for (const doc of applied.docs) {
      try {
        const rows = await querySearchAnalytics({
          startDate,
          endDate,
          dimensions: ['page'],
          page: `${SITE_URL}${doc.pagePath}`,
        })
        const after = rows[0]
        if (!after) continue
        const before = doc.metricsBefore || {}
        // Primary success signal: CTR for metadata changes; position as tiebreak
        const ctrDelta = (after.ctr ?? 0) - (before.ctr ?? 0)
        const posDelta = (before.position ?? 0) - (after.position ?? 0) // positive = improved
        const outcome =
          ctrDelta > 0.005 || posDelta > 0.5
            ? 'improved'
            : ctrDelta < -0.005 || posDelta < -0.5
              ? 'worse'
              : 'no_change'
        await payload.update({
          collection: 'seo-suggestions',
          id: doc.id,
          data: {
            metricsAfter: {
              clicks: after.clicks,
              impressions: after.impressions,
              ctr: after.ctr,
              position: after.position,
            },
            outcome,
          },
        })
        measured++
      } catch (err) {
        console.error(`[seo-agent] measurement failed for ${doc.pagePath}:`, err)
      }
    }

    // ── 2. Find opportunities ──────────────────────────────────────────
    const [pageRows, queryRows] = await Promise.all([
      querySearchAnalytics({ startDate, endDate, dimensions: ['page'], rowLimit: 500 }),
      querySearchAnalytics({
        startDate,
        endDate,
        dimensions: ['page', 'query'],
        rowLimit: 2500,
      }),
    ])
    // Normalize GSC absolute URLs to site paths
    const toPath = (url: string) => {
      try {
        return new URL(url).pathname.replace(/\/$/, '') || '/'
      } catch {
        return url
      }
    }
    const normalizedPages: GscRow[] = pageRows.map((r) => ({ ...r, keys: [toPath(r.keys[0])] }))
    const normalizedQueries: GscRow[] = queryRows.map((r) => ({
      ...r,
      keys: [toPath(r.keys[0]), r.keys[1]],
    }))

    const opportunities = pickOpportunities(normalizedPages, normalizedQueries, 5)

    // ── 3. Generate suggestions ────────────────────────────────────────
    const created: Array<{ path: string; field: string }> = []
    for (const opp of opportunities) {
      // Skip if this page already has a pending suggestion
      const existing = await payload.find({
        collection: 'seo-suggestions',
        where: { pagePath: { equals: opp.path }, status: { equals: 'pending' } },
        limit: 1,
      })
      if (existing.docs.length > 0) continue

      const target = await resolveTarget(payload, opp.path)
      if (!target) continue

      const history = await payload.find({
        collection: 'seo-suggestions',
        where: { pagePath: { equals: opp.path }, status: { equals: 'applied' } },
        limit: 5,
        sort: '-appliedAt',
      })
      const pastExperiments: PastExperiment[] = history.docs.map((d: never) => ({
        field: (d as { field: string }).field,
        suggestedValue: (d as { suggestedValue: string }).suggestedValue,
        outcome: (d as { outcome: string | null }).outcome,
      }))

      try {
        const suggestions = await generateSuggestions({
          opportunity: opp,
          currentTitle: target.seoTitle,
          currentDescription: target.seoDescription,
          pageSummary: target.summary,
          pastExperiments,
        })
        for (const s of suggestions) {
          await payload.create({
            collection: 'seo-suggestions',
            data: {
              pagePath: opp.path,
              target: { collection: target.collection, docId: String(target.id) },
              field: s.field,
              currentValue:
                s.field === 'seoTitle'
                  ? target.seoTitle
                  : s.field === 'seoDescription'
                    ? target.seoDescription
                    : undefined,
              suggestedValue: s.suggested_value,
              rationale: s.rationale,
              targetQueries: s.target_queries.map((q) => ({ query: q })),
              metricsBefore: {
                clicks: opp.clicks,
                impressions: opp.impressions,
                ctr: opp.ctr,
                position: opp.position,
              },
              status: 'pending',
            },
          })
          created.push({ path: opp.path, field: s.field })
        }
      } catch (err) {
        console.error(`[seo-agent] suggestion generation failed for ${opp.path}:`, err)
      }
    }

    // ── 4. Notify ──────────────────────────────────────────────────────
    if (created.length > 0) {
      await sendLeadNotification({
        subject: `SEO agent: ${created.length} new suggestion${created.length === 1 ? '' : 's'} to review`,
        fields: [
          ...created.map(
            (c, i) => [`Suggestion ${i + 1}`, `${c.path} — ${c.field}`] as [string, string],
          ),
          ['Review at', `${SITE_URL}/admin/collections/seo-suggestions`],
          ['Outcomes measured this run', measured],
        ],
      })
    }

    return NextResponse.json({
      ok: true,
      measured,
      opportunities: opportunities.map((o) => o.path),
      created,
    })
  } catch (err) {
    console.error('[seo-agent] run failed:', err)
    return NextResponse.json({ error: 'SEO agent run failed' }, { status: 500 })
  }
}

/**
 * Map a site path to the CMS document that controls its metadata, plus a
 * plain-text summary of its content for the model.
 */
async function resolveTarget(
  payload: AnyPayload,
  path: string,
): Promise<{
  collection: 'pages' | 'posts' | 'market-areas'
  id: string | number
  seoTitle: string | null
  seoDescription: string | null
  summary: string
} | null> {
  const blogMatch = path.match(/^\/blog\/([^/]+)$/)
  if (blogMatch) {
    const { docs } = await payload.find({
      collection: 'posts',
      where: { slug: { equals: blogMatch[1] } },
      limit: 1,
      depth: 0,
    })
    const doc = docs[0]
    if (!doc) return null
    return {
      collection: 'posts',
      id: doc.id,
      seoTitle: doc.meta?.title || doc.title || null,
      seoDescription: doc.meta?.description || null,
      summary: `Blog post: "${doc.title}". Tags: ${(doc.tags || []).map((t: { tag: string }) => t.tag).join(', ')}`,
    }
  }

  const marketMatch = path.match(/^\/market-areas\/([^/]+)$/)
  if (marketMatch) {
    const { docs } = await payload.find({
      collection: 'market-areas',
      where: { slug: { equals: marketMatch[1] } },
      limit: 1,
      depth: 0,
    })
    const doc = docs[0]
    if (!doc) return null
    const sections = (doc.contentSections || [])
      .map((s: { heading: string }) => s.heading)
      .join(' · ')
    return {
      collection: 'market-areas',
      id: doc.id,
      seoTitle: doc.seoTitle || null,
      seoDescription: doc.seoDescription || null,
      summary: `Market page for ${doc.city}, OR. Tagline: ${doc.tagline || ''}. Sections: ${sections}. ${(doc.description || []).map((p: { paragraph: string }) => p.paragraph).join(' ')}`,
    }
  }

  // Top-level CMS pages (privacy, terms, accessibility, and the code-route
  // backing docs: home, about, owners, tenants, contact)
  const slug = path === '/' ? 'home' : path.replace(/^\//, '')
  if (slug.includes('/')) return null
  const { docs } = await payload.find({
    collection: 'pages',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
  })
  const doc = docs[0]
  if (!doc) return null
  return {
    collection: 'pages',
    id: doc.id,
    seoTitle: doc.meta?.title || doc.title || null,
    seoDescription: doc.meta?.description || null,
    summary: `Site page "${doc.title}" (layout: ${doc.layout}).`,
  }
}
