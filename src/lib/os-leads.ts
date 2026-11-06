import type { Payload } from 'payload'
import type { Lead, User } from '@/payload-types'
import { nextStatuses, type LeadStatus } from './crm/types'

export const CLOSED_STATUSES = ['leased', 'signed', 'lost', 'archived'] as const

type UserRef = number | User | null | undefined

export function userSummary(user: UserRef) {
  if (!user || typeof user !== 'object') return null
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ')
  return { id: user.id, name: name || user.email }
}

/** Website users who can own leads, for the assignment dropdown. */
export async function assignableUsers(payload: Payload) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { role: { in: ['admin', 'editor'] } },
    sort: 'firstName',
    limit: 100,
    depth: 0,
    pagination: false,
  })
  return docs.map((u) => userSummary(u)!)
}

/** The website account matching the OS staff member, so CRM history names them. */
export async function websiteUserFor(payload: Payload, email: string) {
  const { docs } = await payload.find({
    collection: 'users',
    where: { email: { equals: email } },
    limit: 1,
    depth: 0,
  })
  return docs[0] ?? null
}

export function leadSummary(lead: Lead) {
  return {
    id: lead.id,
    name: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.email || `Lead ${lead.id}`,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    status: lead.status ?? 'new',
    leadType: lead.leadType ?? null,
    source: lead.source ?? null,
    assignedTo: userSummary(lead.assignedTo as UserRef),
    nextFollowUpAt: lead.nextFollowUpAt ?? null,
    createdAt: lead.createdAt,
    isDuplicateOfLeadId: lead.isDuplicateOfLeadId ?? null,
  }
}

export function allowedNextStatuses(
  status: string | null | undefined,
  leadType?: string | null,
): string[] {
  return nextStatuses((status || 'new') as LeadStatus, leadType)
}

/** Owner pipeline stages shown as columns on the HDPM OS growth board. */
export const BOARD_STATUSES = [
  'new',
  'attempted_contact',
  'engaged',
  'consult_booked',
  'proposal_sent',
  'signed',
  'lost',
] as const

/** The board loads every owner lead at once; this caps a runaway result. */
export const BOARD_LIMIT = 1000

/** A lead as a growth-board card: the summary plus what the card and filters show. */
export function boardLead(lead: Lead) {
  return {
    ...leadSummary(lead),
    expectedDoors: lead.expectedDoors ?? null,
    sourceDetail: lead.sourceDetail ?? null,
    town: lead.subjectProperty?.town ?? null,
    propertyAddress: lead.subjectProperty?.address ?? null,
    // Leads saved before the field existed and missed by the backfill count from creation.
    statusEnteredAt: lead.statusEnteredAt ?? lead.createdAt,
    allowedStatuses: allowedNextStatuses(lead.status, lead.leadType),
  }
}

/** Reads expectedDoors from a PATCH body: a whole number of 0 or more, or null to clear it. */
export function parseExpectedDoors(
  value: unknown,
): { ok: true; value: number | null } | { ok: false; error: string } {
  if (value === null || value === '') return { ok: true, value: null }
  const doors = typeof value === 'string' ? Number(value.trim()) : value
  if (typeof doors !== 'number' || !Number.isSafeInteger(doors) || doors < 0)
    return { ok: false, error: 'Expected doors must be a whole number, 0 or more.' }
  return { ok: true, value: doors }
}
