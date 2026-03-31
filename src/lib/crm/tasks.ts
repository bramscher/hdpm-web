import type { Payload } from 'payload'

interface CreateFollowUpTaskOpts {
  taskType?: string
  title?: string
  dueMinutes?: number
  priority?: string
}

export async function createFollowUpTask(
  payload: Payload,
  leadId: number,
  assignedToId: number,
  opts?: CreateFollowUpTaskOpts,
): Promise<void> {
  const taskType = opts?.taskType ?? 'follow_up_call'
  const title = opts?.title ?? 'Follow up with lead'
  const dueMinutes = opts?.dueMinutes ?? 10
  const priority = opts?.priority ?? 'medium'

  const dueAt = new Date(Date.now() + dueMinutes * 60 * 1000).toISOString()

  // Cast needed: lead-tasks not yet registered in payload.config.ts
  await (payload as any).create({
    collection: 'lead-tasks',
    data: {
      lead: leadId,
      title,
      taskType,
      status: 'open',
      dueAt,
      assignedTo: assignedToId,
      priority,
    },
    depth: 0,
  })
}

interface CreateActivityLogOpts {
  direction?: string
  metadata?: Record<string, unknown>
  performedById?: number
}

export async function createActivityLog(
  payload: Payload,
  leadId: number,
  type: string,
  body: string,
  opts?: CreateActivityLogOpts,
): Promise<void> {
  // Cast needed: lead-activities not yet registered in payload.config.ts
  await (payload as any).create({
    collection: 'lead-activities',
    data: {
      lead: leadId,
      type,
      body,
      direction: opts?.direction ?? undefined,
      metadata: opts?.metadata ?? undefined,
      performedBy: opts?.performedById ?? undefined,
    },
    depth: 0,
  })
}
