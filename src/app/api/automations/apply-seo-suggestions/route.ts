import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { requireAuth } from '@/lib/api-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/automations/apply-seo-suggestions
 *
 * Admin-triggered "Apply all pending". Marks every pending suggestion that
 * targets a real document as `applied`, which fires the seo-suggestions
 * beforeChange hook that writes the change onto the page — same code path as
 * setting one to "Applied" by hand, so there's a single source of truth for
 * how a suggestion is applied. Content suggestions are advisory and left
 * pending. Runs in-process (no internal cron HTTP call / CRON_SECRET handshake).
 */
export async function POST() {
  const auth = await requireAuth({ roles: ['admin', 'editor'] })
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const payload = await getPayload({ config })

  const pending = await payload.find({
    collection: 'seo-suggestions',
    where: { status: { equals: 'pending' } },
    limit: 500,
    depth: 0,
  })

  let applied = 0
  let skipped = 0
  const failed: Array<{ id: number | string; pagePath?: string; error: string }> = []

  for (const doc of pending.docs) {
    // Mirror the hook's guard: content is advisory, and a suggestion with no
    // target can't be applied. Leave those pending instead of stranding them
    // in an "approved but not applied" state.
    if (doc.field === 'content' || !doc.target?.collection || !doc.target?.docId) {
      skipped++
      continue
    }
    try {
      await payload.update({
        collection: 'seo-suggestions',
        id: doc.id,
        data: { status: 'applied' }, // hook writes the change onto the page
      })
      applied++
    } catch (err) {
      failed.push({
        id: doc.id,
        pagePath: doc.pagePath,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  const parts = [`Applied ${applied} suggestion${applied === 1 ? '' : 's'}`]
  if (skipped) parts.push(`skipped ${skipped} advisory`)
  if (failed.length) parts.push(`${failed.length} failed`)

  return NextResponse.json({
    message: parts.join(', '),
    applied,
    skipped,
    failed,
  })
}
