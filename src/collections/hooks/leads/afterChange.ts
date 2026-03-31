import type { CollectionAfterChangeHook } from 'payload'

export const leadsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  previousDoc,
}) => {
  if (operation === 'create') {
    // TODO: Replace with LeadActivity creation in Phase 2
    console.log(`[CRM] Lead created: ${doc.id} — ${doc.firstName} ${doc.lastName} <${doc.email}>`)
  }

  if (operation === 'update') {
    // Log status transitions
    if (previousDoc?.status && doc.status && previousDoc.status !== doc.status) {
      // TODO: Replace with LeadActivity creation in Phase 2
      console.log(
        `[CRM] Lead ${doc.id} status changed: ${previousDoc.status} → ${doc.status}`,
      )
    }
  }

  return doc
}
