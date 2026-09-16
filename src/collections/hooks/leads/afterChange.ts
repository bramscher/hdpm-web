import type { CollectionAfterChangeHook } from 'payload'
import { createActivityLog, createFollowUpTask } from '../../../lib/crm/tasks'

export const leadsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  // Await dependent writes in the lead's transaction. A scheduled callback
  // neither guarantees the lead has committed nor survives a serverless exit.
  if (operation === 'create') {
    const source = doc.source ?? 'unknown'
    const assignedToId =
      typeof doc.assignedTo === 'object' ? doc.assignedTo?.id : doc.assignedTo

    await createActivityLog(req.payload, doc.id, 'note', `Lead created from ${source}`, {
      direction: 'internal',
      performedById: req.user?.id,
      req,
    })

    if (assignedToId) {
      await createFollowUpTask(req.payload, doc.id, assignedToId, {
        taskType: 'follow_up_call',
        title: `Initial follow-up: ${doc.firstName} ${doc.lastName}`,
        dueMinutes: 10,
        priority: 'high',
        req,
      })
    }
  }

  if (operation === 'update' && previousDoc?.status && doc.status && previousDoc.status !== doc.status) {
    await createActivityLog(
      req.payload,
      doc.id,
      'status_changed',
      `Status changed from ${previousDoc.status} to ${doc.status}`,
      {
        direction: 'internal',
        metadata: { from: previousDoc.status, to: doc.status },
        performedById: req.user?.id,
        req,
      },
    )
  }

  return doc
}
