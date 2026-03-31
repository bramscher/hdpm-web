import type { CollectionAfterChangeHook } from 'payload'

export const leadTasksAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
  req,
}) => {
  const leadId = typeof doc.lead === 'object' ? doc.lead.id : doc.lead

  // Auto-set completedAt when status changes to 'complete'
  if (
    operation === 'update' &&
    doc.status === 'complete' &&
    previousDoc?.status !== 'complete' &&
    !doc.completedAt
  ) {
    // Cast needed: lead-tasks not yet registered in payload.config.ts
    await (req.payload as any).update({
      collection: 'lead-tasks',
      id: doc.id,
      data: {
        completedAt: new Date().toISOString(),
      },
      depth: 0,
    })
  }

  // Log activity when a task is created
  if (operation === 'create') {
    await (req.payload as any).create({
      collection: 'lead-activities',
      data: {
        lead: leadId,
        type: 'task_created',
        direction: 'internal',
        body: `Task created: ${doc.title}`,
        metadata: {
          taskId: doc.id,
          taskType: doc.taskType,
          dueAt: doc.dueAt,
          priority: doc.priority,
        },
        performedBy: req.user?.id ?? undefined,
      },
      depth: 0,
    })
  }

  // Log activity when a task is completed
  if (
    operation === 'update' &&
    doc.status === 'complete' &&
    previousDoc?.status !== 'complete'
  ) {
    await (req.payload as any).create({
      collection: 'lead-activities',
      data: {
        lead: leadId,
        type: 'task_completed',
        direction: 'internal',
        body: `Task completed: ${doc.title}`,
        metadata: {
          taskId: doc.id,
          taskType: doc.taskType,
        },
        performedBy: req.user?.id ?? undefined,
      },
      depth: 0,
    })
  }

  return doc
}
