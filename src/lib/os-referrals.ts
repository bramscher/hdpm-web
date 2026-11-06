import type { Payload, Where } from 'payload'
import type { Lead, User } from '@/payload-types'
import { normalizeEmail, normalizePhone, splitName } from './crm/normalization'

/**
 * Partner referrals from the HDPM OS partner portal become website owner leads,
 * so the growth board shows one pipeline. HDPM OS calls
 * PUT /api/os/leads/referrals/{referralId}; the referral id makes resends safe.
 */

const TOWNS = ['Bend', 'Redmond', 'Sisters', 'Prineville', 'Culver', 'Other'] as const
type Town = (typeof TOWNS)[number]
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export type ReferralInput = {
  referralId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  propertyAddress: string | null
  town: Town | null
  unitCount: number | null
  notes: string | null
  partner: { id: string; name: string; company: string | null } | null
  refCode: string | null
  landingPage: string | null
  utm: Record<'utmSource' | 'utmMedium' | 'utmCampaign' | 'utmTerm' | 'utmContent', string | null> | null
}

type ParseResult =
  | { ok: true; value: ReferralInput }
  | { ok: false; status: 400 | 422; error: string; code?: string }

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed ? trimmed.slice(0, max) : null
}

const bad = (error: string): ParseResult => ({ ok: false, status: 400, error })

/** Validates the HDPM OS referral body. Pure, so it is tested without a database. */
export function parseReferral(referralId: string, body: unknown): ParseResult {
  if (!UUID.test(referralId)) return bad('The referral id must be the HDPM OS referral_lead id.')
  if (!body || typeof body !== 'object') return bad('Send the referral as a JSON object.')
  const b = body as Record<string, unknown>

  const name = splitName(text(b.prospectName, 200) || '')
  if (!name.firstName) return bad('The referral needs the prospect’s name.')

  const rawEmail = text(b.prospectEmail, 254)
  if (!rawEmail)
    return {
      ok: false,
      status: 422,
      code: 'email_required',
      error: 'Website leads need an email. Add the prospect’s email, then resend the referral.',
    }
  const email = normalizeEmail(rawEmail)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return bad('The prospect’s email is not valid.')

  const rawPhone = text(b.prospectPhone, 40)
  const phone = rawPhone ? normalizePhone(rawPhone) || null : null

  let town: Town | null = null
  if (b.town != null) {
    if (!TOWNS.includes(b.town as Town)) return bad(`Town must be one of ${TOWNS.join(', ')}.`)
    town = b.town as Town
  }

  let unitCount: number | null = null
  if (b.unitCount != null) {
    if (typeof b.unitCount !== 'number' || !Number.isSafeInteger(b.unitCount) || b.unitCount < 0)
      return bad('Unit count must be a whole number, 0 or more.')
    unitCount = b.unitCount
  }

  let partner: ReferralInput['partner'] = null
  if (b.partner != null) {
    const p = b.partner as Record<string, unknown>
    const id = typeof p === 'object' ? text(p.id, 64) : null
    const partnerName = typeof p === 'object' ? text(p.name, 200) : null
    if (!id || !UUID.test(id) || !partnerName) return bad('The partner needs an id and a name.')
    partner = { id, name: partnerName, company: text(p.company, 200) }
  }

  let utm: ReferralInput['utm'] = null
  if (b.utm && typeof b.utm === 'object') {
    const u = b.utm as Record<string, unknown>
    utm = {
      utmSource: text(u.source, 200),
      utmMedium: text(u.medium, 200),
      utmCampaign: text(u.campaign, 200),
      utmTerm: text(u.term, 200),
      utmContent: text(u.content, 200),
    }
  }

  return {
    ok: true,
    value: {
      referralId: referralId.toLowerCase(),
      firstName: name.firstName,
      // Leads.lastName is required; single-word names use the same dash as web intake.
      lastName: name.lastName || '—',
      email,
      phone,
      propertyAddress: text(b.propertyAddress, 300),
      town,
      unitCount,
      notes: text(b.notes, 5000),
      partner,
      refCode: text(b.refCode, 100),
      landingPage: text(b.landingPage, 500),
      utm,
    },
  }
}

/** How the partner shows on the lead and the board: "Name (Company)". */
export function partnerLabel(partner: NonNullable<ReferralInput['partner']>) {
  return partner.company && partner.company !== partner.name
    ? `${partner.name} (${partner.company})`
    : partner.name
}

export type ReferralOutcome = 'created' | 'existing' | 'linked'

/**
 * Creates or finds the website lead for a referral:
 * - existing: a lead already carries this referral id. Nothing changes.
 * - linked: the email or phone matches an owner lead (oldest first). It gets a
 *   history note, and the referral id if it has none yet; its contact, source,
 *   stage and assignee stay as they were, so the first touch keeps the attribution.
 * - created: a new owner lead, through the normal lead hooks (round-robin,
 *   follow-up task, Slack card). A match on a non-owner lead still creates one;
 *   the hook marks it as a duplicate.
 */
export async function upsertReferralLead(
  payload: Payload,
  input: ReferralInput,
  user: User | null,
): Promise<{ outcome: ReferralOutcome; lead: Lead }> {
  const asUser = user ? { user } : {}
  const existing = await payload.find({
    collection: 'leads',
    where: { referralLeadId: { equals: input.referralId } },
    limit: 1,
    depth: 1,
  })
  if (existing.docs[0]) return { outcome: 'existing', lead: existing.docs[0] }

  const contact: Where[] = [{ email: { equals: input.email } }]
  if (input.phone) contact.push({ phone: { equals: input.phone } })
  const match = await payload.find({
    collection: 'leads',
    where: { and: [{ leadType: { equals: 'owner' } }, { or: contact }] },
    sort: 'createdAt',
    limit: 1,
    depth: 0,
  })
  const owner = match.docs[0]
  const by = input.partner ? partnerLabel(input.partner) : 'the partner portal'

  if (owner) {
    // The first referral is stamped on the lead so its resends find it directly.
    // A second partner's referral for the same owner links with a note only, so
    // the board never shows the owner twice or counts their doors twice.
    const lead = owner.referralLeadId
      ? await payload.findByID({ collection: 'leads', id: owner.id, depth: 1 })
      : await payload.update({
          collection: 'leads',
          id: owner.id,
          data: { referralLeadId: input.referralId },
          depth: 1,
          ...asUser,
        })
    await payload.create({
      collection: 'lead-activities',
      data: {
        lead: owner.id,
        type: 'note',
        direction: 'inbound',
        body: [
          `Also referred by ${by} through the HDPM OS partner portal.`,
          'This lead’s contact, source and stage were kept as they were. Check the referral before changing attribution.',
          input.propertyAddress ? `Referred property: ${input.propertyAddress}` : '',
          input.unitCount != null ? `Referred units: ${input.unitCount}` : '',
          input.notes ? `Partner notes: ${input.notes}` : '',
        ].filter(Boolean).join('\n'),
        metadata: {
          kind: 'partner_referral_link',
          referralLeadId: input.referralId,
          partnerId: input.partner?.id ?? null,
        },
      },
      ...asUser,
    })
    return { outcome: 'linked', lead }
  }

  const lead = await payload.create({
    collection: 'leads',
    data: {
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      ...(input.phone ? { phone: input.phone } : {}),
      leadType: 'owner',
      status: 'new',
      source: input.partner ? 'referral' : 'website',
      sourceDetail: input.partner ? partnerLabel(input.partner) : 'Partner portal',
      referralLeadId: input.referralId,
      referralPartnerId: input.partner?.id ?? null,
      referralPartnerName: input.partner ? partnerLabel(input.partner) : null,
      expectedDoors: input.unitCount,
      message: input.notes ?? undefined,
      subjectProperty: { address: input.propertyAddress, town: input.town },
      attribution: {
        ...(input.utm ?? {}),
        landingPage: input.landingPage,
        referrer: input.refCode ? `ref:${input.refCode}` : null,
      },
    },
    depth: 1,
    ...asUser,
  })
  return { outcome: 'created', lead }
}
