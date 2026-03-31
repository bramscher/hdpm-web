import { NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

/**
 * GET /api/crm/reports
 *
 * Aggregated CRM reporting data. Used by the reporting dashboard view.
 * Returns counts grouped by various dimensions.
 */
export async function GET() {
  try {
    const payload: AnyPayload = await getPayload({ config })

    // Fetch all leads (limited to 1000 for performance)
    const { docs: leads } = await payload.find({
      collection: 'leads',
      limit: 1000,
      depth: 1,
      sort: '-createdAt',
    })

    // Fetch open/overdue tasks
    const { docs: tasks } = await payload.find({
      collection: 'lead-tasks',
      where: { status: { in: ['open', 'in_progress', 'overdue'] } },
      limit: 500,
      depth: 1,
    })

    // Leads by status
    const byStatus: Record<string, number> = {}
    for (const lead of leads) {
      const s = lead.status || 'unknown'
      byStatus[s] = (byStatus[s] || 0) + 1
    }

    // Leads by source
    const bySource: Record<string, number> = {}
    for (const lead of leads) {
      const s = lead.source || 'unknown'
      bySource[s] = (bySource[s] || 0) + 1
    }

    // Leads by language
    const byLanguage: Record<string, number> = { en: 0, es: 0 }
    for (const lead of leads) {
      const lang = lead.preferredLanguage || 'en'
      byLanguage[lang] = (byLanguage[lang] || 0) + 1
    }

    // Leads by type
    const byType: Record<string, number> = {}
    for (const lead of leads) {
      const t = lead.leadType || 'unknown'
      byType[t] = (byType[t] || 0) + 1
    }

    // Open tasks by assigned user
    const tasksByUser: Record<string, number> = {}
    for (const task of tasks) {
      const user = typeof task.assignedTo === 'object' && task.assignedTo
        ? ((task.assignedTo as { email?: string }).email || 'Unknown')
        : 'Unassigned'
      tasksByUser[user] = (tasksByUser[user] || 0) + 1
    }

    // Conversion funnel
    const funnel = [
      'new', 'attempted_contact', 'engaged', 'tour_scheduled',
      'toured', 'applied', 'approved', 'leased',
    ].map((status) => ({
      status,
      count: byStatus[status] || 0,
    }))

    // This week's leads
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const leadsThisWeek = leads.filter((l: Record<string, unknown>) => new Date(l.createdAt as string) > weekAgo).length

    // Response SLA: average time from creation to first activity (approximation)
    const respondedLeads = leads.filter((l: Record<string, unknown>) =>
      l.status !== 'new' || l.lastContactedAt,
    ).length

    return NextResponse.json({
      totalLeads: leads.length,
      leadsThisWeek,
      respondedLeads,
      responseRate: leads.length > 0 ? Math.round((respondedLeads / leads.length) * 100) : 0,
      openTasks: tasks.length,
      byStatus,
      bySource,
      byLanguage,
      byType,
      tasksByUser,
      funnel,
    })
  } catch (err) {
    console.error('[CRM Reports Error]', err)
    return NextResponse.json(
      { error: 'Failed to generate reports', details: String(err) },
      { status: 500 },
    )
  }
}
