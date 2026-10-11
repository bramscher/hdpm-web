import type { Payload } from 'payload'
import type { Lead, User } from '@/payload-types'
import { ValidStatusTransitions, type LeadStatus } from './crm/types'

export const CLOSED_STATUSES = ['leased', 'lost', 'archived'] as const

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

export function allowedNextStatuses(status: string | null | undefined): string[] {
  return ValidStatusTransitions[(status || 'new') as LeadStatus] ?? []
}
