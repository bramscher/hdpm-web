import type { CollectionAfterChangeHook } from 'payload'

export const leadConversationsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create') return doc

  const leadId = typeof doc.lead === 'object' ? doc.lead.id : doc.lead
  if (!leadId) return doc

  const now = new Date().toISOString()

  const updateData: Record<string, string> = {
    lastContactedAt: now,
  }

  if (doc.direction === 'inbound') {
    updateData.lastInboundAt = now
  }

  if (doc.direction === 'outbound') {
    updateData.lastOutboundAt = now
  }

  try {
    await req.payload.update({
      collection: 'leads',
      id: leadId,
      data: updateData,
    })
  } catch (error) {
    req.payload.logger.error(
      `[CRM] Failed to update lead ${leadId} contact timestamps: ${error}`,
    )
  }

  return doc
}
