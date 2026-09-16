import type { CollectionBeforeChangeHook } from 'payload'

export const leadTasksBeforeChange: CollectionBeforeChangeHook = ({
  data,
  operation,
  originalDoc,
}) => {
  if (
    operation === 'update' &&
    data.status === 'complete' &&
    originalDoc?.status !== 'complete' &&
    !data.completedAt &&
    !originalDoc?.completedAt
  ) {
    data.completedAt = new Date().toISOString()
  }
  return data
}
