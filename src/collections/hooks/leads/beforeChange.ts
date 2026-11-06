import type { CollectionBeforeChangeHook } from 'payload'
import { normalizeEmail, normalizePhone } from '../../../lib/crm/normalization'
import { findDuplicateLead } from '../../../lib/crm/dedup'
import { assignLeadRoundRobin } from '../../../lib/crm/assignment'
import { getStatusLabel, isValidTransition } from '../../../lib/crm/pipeline'
import { LeadStatus } from '../../../lib/crm/types'

export const leadsBeforeChange: CollectionBeforeChangeHook = async ({
  data,
  operation,
  originalDoc,
  req,
}) => {
  if (operation === 'create') {
    // Normalize email
    if (data.email) {
      data.email = normalizeEmail(data.email)
    }

    // Normalize phone
    if (data.phone) {
      data.phone = normalizePhone(data.phone)
    }

    // Check for duplicates
    const duplicateId = await findDuplicateLead(req.payload, data.email, data.phone)
    if (duplicateId) {
      data.isDuplicateOfLeadId = duplicateId
    }

    // Auto-assign via round-robin if no assignedTo set
    if (!data.assignedTo) {
      const assignedUserId = await assignLeadRoundRobin(req.payload, {
        preferredLanguage: data.preferredLanguage,
        leadType: data.leadType,
      })
      if (assignedUserId) {
        data.assignedTo = assignedUserId
      }
    }

    // Days in stage count from here until the first status change.
    if (!data.statusEnteredAt) data.statusEnteredAt = new Date().toISOString()

    // Set default nextFollowUpAt to 10 minutes from now if not set
    if (!data.nextFollowUpAt) {
      const tenMinutes = new Date(Date.now() + 10 * 60 * 1000)
      data.nextFollowUpAt = tenMinutes.toISOString()
    }
  }

  if (operation === 'update') {
    // Validate status transitions
    if (
      data.status &&
      originalDoc?.status &&
      data.status !== originalDoc.status
    ) {
      const from = originalDoc.status as LeadStatus
      const to = data.status as LeadStatus
      const leadType = data.leadType ?? originalDoc.leadType
      if (!isValidTransition(from, to, leadType)) {
        // Shown as-is by the HDPM OS pipeline board when a drag is refused.
        throw new Error(
          `Can't move a lead from ${getStatusLabel(from)} to ${getStatusLabel(to)}.`,
        )
      }
      data.statusEnteredAt = new Date().toISOString()
    }
  }

  return data
}
