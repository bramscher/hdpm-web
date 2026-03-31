/**
 * AppFolio Guest Card Handoff
 *
 * Stub implementation for pushing qualified leads to AppFolio as guest cards.
 * AppFolio's Partner API does not currently support guest card creation via REST,
 * so this service queues the intent and logs it for manual follow-up.
 *
 * When AppFolio adds guest card write support, implement the actual API call
 * in pushToAppFolio() and remove the stub logging.
 *
 * TODO: Connect to AppFolio Partner API v1 guest card endpoint when available
 * TODO: Add webhook listener for AppFolio guest card status updates
 */

import type { Payload } from 'payload'

export interface AppFolioHandoffResult {
  success: boolean
  guestCardId: string | null
  message: string
}

export interface LeadForHandoff {
  id: number
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  preferredLanguage?: string
  desiredMoveInDate?: string | null
  monthlyBudgetMin?: number | null
  monthlyBudgetMax?: number | null
  notesSummary?: string | null
  message?: string | null
}

/**
 * Push a lead to AppFolio as a guest card.
 *
 * Currently a stub that logs the handoff and returns a placeholder ID.
 * The lead's appfolioGuestCardId field should be updated with the returned ID.
 */
export async function pushToAppFolio(
  payload: Payload,
  lead: LeadForHandoff,
): Promise<AppFolioHandoffResult> {
  // --- STUB IMPLEMENTATION ---
  // When AppFolio supports guest card creation, replace this with:
  //
  // const response = await fetch(`${APPFOLIO_API_BASE}/guest_cards`, {
  //   method: 'POST',
  //   headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     first_name: lead.firstName,
  //     last_name: lead.lastName,
  //     email: lead.email,
  //     phone: lead.phone,
  //     desired_move_in: lead.desiredMoveInDate,
  //     budget_min: lead.monthlyBudgetMin,
  //     budget_max: lead.monthlyBudgetMax,
  //     notes: lead.notesSummary || lead.message,
  //   }),
  // })

  const stubId = `STUB-${Date.now()}-${lead.id}`

  console.log(`[AppFolio Handoff] Lead #${lead.id} (${lead.firstName} ${lead.lastName}) queued for guest card creation. Stub ID: ${stubId}`)

  // Update the lead with the stub guest card ID
  await payload.update({
    collection: 'leads',
    id: lead.id,
    data: { appfolioGuestCardId: stubId },
  })

  return {
    success: true,
    guestCardId: stubId,
    message: `Lead queued for AppFolio guest card creation (stub). Manual entry required until API integration is live.`,
  }
}

/**
 * Check if a lead has already been pushed to AppFolio.
 */
export function isHandedOff(appfolioGuestCardId: string | null | undefined): boolean {
  return !!appfolioGuestCardId && appfolioGuestCardId.length > 0
}

/**
 * Mark a lead as manually pushed to AppFolio.
 * Used when staff manually creates the guest card and wants to record the ID.
 */
export async function markManualHandoff(
  payload: Payload,
  leadId: number,
  guestCardId: string,
): Promise<void> {
  await payload.update({
    collection: 'leads',
    id: leadId,
    data: { appfolioGuestCardId: guestCardId },
  })
}
