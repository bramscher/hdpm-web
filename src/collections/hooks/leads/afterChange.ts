import type { CollectionAfterChangeHook } from 'payload'
import { createActivityLog, createFollowUpTask } from '../../../lib/crm/tasks'

export const leadsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  if (operation === 'create') {
    const source = doc.source ?? 'unknown'

    // Log lead creation activity
    await createActivityLog(req.payload, doc.id, 'note', `Lead created from ${source}`, {
      direction: 'internal',
      performedById: req.user?.id ?? undefined,
    })

    // Create initial follow-up task for the assigned user
    const assignedToId =
      typeof doc.assignedTo === 'object' ? doc.assignedTo?.id : doc.assignedTo
    if (assignedToId) {
      await createFollowUpTask(req.payload, doc.id, assignedToId, {
        taskType: 'follow_up_call',
        title: `Initial follow-up: ${doc.firstName} ${doc.lastName}`,
        dueMinutes: 10,
        priority: 'high',
      })
    }
  }

  if (operation === 'update') {
    // Log status transitions
    if (previousDoc?.status && doc.status && previousDoc.status !== doc.status) {
      await createActivityLog(
        req.payload,
        doc.id,
        'status_changed',
        `Status changed from ${previousDoc.status} to ${doc.status}`,
        {
          direction: 'internal',
          metadata: { from: previousDoc.status, to: doc.status },
          performedById: req.user?.id ?? undefined,
        },
      )
    }
  }

  return doc
}
