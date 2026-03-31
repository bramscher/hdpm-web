import type { CollectionAfterChangeHook } from 'payload'
import { createActivityLog, createFollowUpTask } from '../../../lib/crm/tasks'

export const leadsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  // Defer side effects to run after the transaction commits
  // Using setImmediate/setTimeout to escape the transaction context
  if (operation === 'create') {
    const source = doc.source ?? 'unknown'
    const assignedToId =
      typeof doc.assignedTo === 'object' ? doc.assignedTo?.id : doc.assignedTo
    const userId = req.user?.id

    setImmediate(async () => {
      try {
        await createActivityLog(req.payload, doc.id, 'note', `Lead created from ${source}`, {
          direction: 'internal',
          performedById: userId ?? undefined,
        })

        if (assignedToId) {
          await createFollowUpTask(req.payload, doc.id, assignedToId, {
            taskType: 'follow_up_call',
            title: `Initial follow-up: ${doc.firstName} ${doc.lastName}`,
            dueMinutes: 10,
            priority: 'high',
          })
        }
      } catch (err) {
        console.error('[CRM] Failed to create post-lead activity/task:', err)
      }
    })
  }

  if (operation === 'update') {
    if (previousDoc?.status && doc.status && previousDoc.status !== doc.status) {
      const userId = req.user?.id
      setImmediate(async () => {
        try {
          await createActivityLog(
            req.payload,
            doc.id,
            'status_changed',
            `Status changed from ${previousDoc.status} to ${doc.status}`,
            {
              direction: 'internal',
              metadata: { from: previousDoc.status, to: doc.status },
              performedById: userId ?? undefined,
            },
          )
        } catch (err) {
          console.error('[CRM] Failed to log status change:', err)
        }
      })
    }
  }

  return doc
}
