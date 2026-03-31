import type { Payload } from 'payload'
import { CLOSED_STATUSES } from './types'

interface AssignLeadOpts {
  preferredLanguage?: string
  leadType?: string
}

/**
 * Round-robin lead assignment.
 * Picks the assignable user with the fewest open leads, respecting language
 * preference and capacity caps.
 *
 * Returns the user ID to assign, or null if no one is available.
 */
export async function assignLeadRoundRobin(
  payload: Payload,
  opts?: AssignLeadOpts,
): Promise<number | null> {
  // Fetch all assignable users
  const { docs: users } = await payload.find({
    collection: 'users',
    where: { isAssignable: { equals: true } },
    limit: 100,
    pagination: false,
  })

  if (users.length === 0) return null

  // If Spanish preferred, separate Spanish-speaking users
  let preferred = users
  if (opts?.preferredLanguage === 'es') {
    const spanishSpeakers = users.filter(
      (u) => (u as unknown as { speaksSpanish?: boolean }).speaksSpanish === true,
    )
    if (spanishSpeakers.length > 0) {
      preferred = spanishSpeakers
    }
    // Fall back to all assignable users if no Spanish speakers
  }

  // Count open leads per user
  const closedValues = CLOSED_STATUSES.map((s) => s as string)
  const candidates: Array<{ userId: number; openCount: number; maxLeads: number }> = []

  for (const user of preferred) {
    const userId = user.id as number
    const maxLeads = ((user as unknown as { maxLeads?: number }).maxLeads) || Infinity

    const { totalDocs: openCount } = await payload.count({
      collection: 'leads',
      where: {
        assignedTo: { equals: userId },
        status: { not_in: closedValues },
      },
    })

    if (openCount < maxLeads) {
      candidates.push({ userId, openCount, maxLeads })
    }
  }

  if (candidates.length === 0) return null

  // Pick user with fewest open leads
  candidates.sort((a, b) => a.openCount - b.openCount)
  return candidates[0].userId
}
