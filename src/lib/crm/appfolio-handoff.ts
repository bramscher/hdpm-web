/**
 * AppFolio Guest Card Handoff
 *
 * Interim implementation. AppFolio's Partner API does not currently grant our
 * account guest card write access via REST, so instead of creating the guest
 * card directly we email a fully-formatted guest card to the staff inbox
 * (info@highdesertpm.com) for a team member to key into AppFolio by hand
 * (Leasing → Guest Cards). The lead is marked with a MANUAL-* id so we never
 * send the same guest card twice.
 *
 * When AppFolio grants write access, replace the email in pushToAppFolio()
 * with the real API call (skeleton preserved below) and keep the same call
 * sites — nothing upstream needs to change.
 *
 * TODO: Connect to AppFolio guest card write endpoint when access is granted
 * TODO: Add webhook listener for AppFolio guest card status updates
 */

import type { Payload } from 'payload'
import { sendLeadNotification } from '@/lib/notify'

export interface AppFolioHandoffResult {
  success: boolean
  guestCardId: string | null
  message: string
}

export interface GuestCardInput {
  id: number
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  preferredLanguage?: string | null
  source?: string | null
  sourceDetail?: string | null
  desiredMoveInDate?: string | null
  monthlyBudgetMin?: number | null
  monthlyBudgetMax?: number | null
  notesSummary?: string | null
  message?: string | null
  /** Property the prospect is interested in (guest cards are unit-scoped in AppFolio). */
  propertyAddress?: string | null
  propertyExternalId?: string | null
  listingUrl?: string | null
}

/** @deprecated use GuestCardInput */
export type LeadForHandoff = GuestCardInput

function formatBudget(min?: number | null, max?: number | null): string | undefined {
  if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}/mo`
  if (max) return `up to $${max.toLocaleString()}/mo`
  if (min) return `$${min.toLocaleString()}+/mo`
  return undefined
}

function formatLanguage(code?: string | null): string | undefined {
  if (!code) return undefined
  if (code === 'es') return 'Spanish'
  if (code === 'en') return 'English'
  return code
}

/**
 * Hand a lead off to staff as an AppFolio guest card.
 *
 * Interim behaviour: emails a formatted guest card to the staff inbox for
 * manual entry into AppFolio, and records a MANUAL-* marker on the lead so the
 * same guest card is not sent twice. Never throws — a handoff failure must not
 * fail the lead submission (the lead is already saved in the CRM) — but it
 * returns success: false and logs loudly so misconfiguration is visible.
 */
export async function pushToAppFolio(
  payload: Payload,
  lead: GuestCardInput,
): Promise<AppFolioHandoffResult> {
  // --- FUTURE: direct API write (pending AppFolio guest card write access) ---
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
  // ... capture response guest card id, use it in place of the MANUAL-* marker.

  const fullName = `${lead.firstName} ${lead.lastName}`.trim()

  const sent = await sendLeadNotification({
    subject: `New guest card to enter in AppFolio — ${fullName}`,
    warning:
      'Manual step required: create this guest card in AppFolio (Leasing → Guest Cards) from the fields below.',
    fields: [
      ['First name', lead.firstName],
      ['Last name', lead.lastName],
      ['Email', lead.email],
      ['Phone', lead.phone],
      ['Property of interest', lead.propertyAddress],
      ['AppFolio listing ID', lead.propertyExternalId],
      ['Listing URL', lead.listingUrl],
      ['Desired move-in', lead.desiredMoveInDate],
      ['Budget', formatBudget(lead.monthlyBudgetMin, lead.monthlyBudgetMax)],
      ['Preferred language', formatLanguage(lead.preferredLanguage)],
      ['Source', [lead.source, lead.sourceDetail].filter(Boolean).join(' — ')],
      ['Notes / message', lead.notesSummary || lead.message],
      ['CRM lead #', lead.id],
    ],
  })

  const marker = `MANUAL-${lead.id}`

  try {
    await payload.update({
      collection: 'leads',
      id: lead.id,
      data: { appfolioGuestCardId: marker },
    })
  } catch (err) {
    console.error(`[AppFolio Handoff] Failed to mark lead #${lead.id} as handed off:`, err)
  }

  return {
    success: sent,
    guestCardId: marker,
    message: sent
      ? 'Guest card emailed to staff for manual AppFolio entry.'
      : 'Guest card email FAILED to send — check RESEND_API_KEY and logs; lead is still saved in the CRM.',
  }
}

/**
 * Check if a lead has already been pushed to AppFolio (or emailed for manual entry).
 */
export function isHandedOff(appfolioGuestCardId: string | null | undefined): boolean {
  return !!appfolioGuestCardId && appfolioGuestCardId.length > 0
}

/**
 * Record the real AppFolio guest card id after staff create it manually,
 * replacing the interim MANUAL-* marker.
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
