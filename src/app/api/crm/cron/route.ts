import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

const CRON_SECRET = process.env.CRON_SECRET || ''

// Helper to work around Payload's strict collection typing during development
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

/**
 * GET /api/crm/cron
 *
 * Periodic automation endpoint. Run via Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const payload: AnyPayload = await getPayload({ config })
  const now = new Date().toISOString()
  const results: string[] = []

  // 1. Mark overdue tasks
  const { docs: overdueTasks } = await payload.find({
    collection: 'lead-tasks',
    where: { status: { equals: 'open' }, dueAt: { less_than: now } },
    limit: 100,
  })

  for (const task of overdueTasks) {
    await payload.update({
      collection: 'lead-tasks',
      id: task.id,
      data: { status: 'overdue' },
    })
  }
  if (overdueTasks.length > 0) {
    results.push(`Marked ${overdueTasks.length} tasks as overdue`)
  }

  // 2. Escalation: leads in "new" status >30 min with no open tasks
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  const { docs: staleNewLeads } = await payload.find({
    collection: 'leads',
    where: { status: { equals: 'new' }, createdAt: { less_than: thirtyMinAgo } },
    limit: 50,
  })

  for (const lead of staleNewLeads) {
    const { totalDocs: openTasks } = await payload.find({
      collection: 'lead-tasks',
      where: { lead: { equals: lead.id }, status: { in: ['open', 'in_progress'] } },
      limit: 0,
    })

    if (openTasks === 0) {
      const assignedToId = typeof lead.assignedTo === 'object' ? lead.assignedTo?.id : lead.assignedTo
      if (assignedToId) {
        await payload.create({
          collection: 'lead-tasks',
          data: {
            lead: lead.id,
            title: `ESCALATION: No contact with ${lead.firstName} ${lead.lastName}`,
            description: 'Lead in "new" status >30min with no open tasks.',
            taskType: 'follow_up_call',
            status: 'open',
            priority: 'high',
            dueAt: now,
            assignedTo: assignedToId,
          },
        })
        results.push(`Escalation created for lead #${lead.id}`)
      }
    }
  }

  // 3. Post-tour follow-up: toured >24h with no open tasks
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { docs: touredLeads } = await payload.find({
    collection: 'leads',
    where: { status: { equals: 'toured' }, updatedAt: { less_than: oneDayAgo } },
    limit: 50,
  })

  for (const lead of touredLeads) {
    const { totalDocs: openTasks } = await payload.find({
      collection: 'lead-tasks',
      where: { lead: { equals: lead.id }, status: { in: ['open', 'in_progress'] } },
      limit: 0,
    })

    if (openTasks === 0) {
      const assignedToId = typeof lead.assignedTo === 'object' ? lead.assignedTo?.id : lead.assignedTo
      if (assignedToId) {
        await payload.create({
          collection: 'lead-tasks',
          data: {
            lead: lead.id,
            title: `Post-tour follow-up: ${lead.firstName} ${lead.lastName}`,
            description: 'Toured but no application. Follow up to encourage next step.',
            taskType: 'follow_up_call',
            status: 'open',
            priority: 'medium',
            dueAt: now,
            assignedTo: assignedToId,
          },
        })
        results.push(`Post-tour task created for lead #${lead.id}`)
      }
    }
  }

  return NextResponse.json({ success: true, timestamp: now, actions: results })
}
