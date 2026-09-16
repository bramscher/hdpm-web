import type { Payload, PayloadRequest } from 'payload'
import type { LeadActivity, LeadTask } from '../../payload-types'

interface CreateFollowUpTaskOpts {
  taskType?: LeadTask['taskType']
  title?: string
  dueMinutes?: number
  priority?: LeadTask['priority']
  req?: PayloadRequest
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

  await payload.create({
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
    req: opts?.req,
  })
}

interface CreateActivityLogOpts {
  direction?: LeadActivity['direction']
  metadata?: Record<string, unknown>
  performedById?: number
  req?: PayloadRequest
}

export async function createActivityLog(
  payload: Payload,
  leadId: number,
  type: LeadActivity['type'],
  body: string,
  opts?: CreateActivityLogOpts,
): Promise<void> {
  await payload.create({
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
    req: opts?.req,
  })
}
