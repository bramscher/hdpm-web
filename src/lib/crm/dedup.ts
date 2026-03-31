import type { Payload } from 'payload'
import { normalizeEmail, normalizePhone } from './normalization'

/**
 * Find an existing lead that matches the given email or phone.
 * Checks normalized email first, then falls back to normalized phone.
 * Returns the existing lead ID if a duplicate is found, null otherwise.
 */
export async function findDuplicateLead(
  payload: Payload,
  email?: string,
  phone?: string,
): Promise<number | null> {
  // Try email match first
  if (email) {
    const normalized = normalizeEmail(email)
    const { docs } = await payload.find({
      collection: 'leads',
      where: { email: { equals: normalized } },
      limit: 1,
    })
    if (docs.length > 0) {
      return docs[0].id as number
    }
  }

  // Fall back to phone match
  if (phone) {
    const normalized = normalizePhone(phone)
    if (normalized) {
      const { docs } = await payload.find({
        collection: 'leads',
        where: { phone: { equals: normalized } },
        limit: 1,
      })
      if (docs.length > 0) {
        return docs[0].id as number
      }
    }
  }

  return null
}
