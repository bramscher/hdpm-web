import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizeEmail, normalizePhone, splitName } from '@/lib/crm/normalization'
import { findDuplicateLead } from '@/lib/crm/dedup'
import { pushToAppFolio } from '@/lib/crm/appfolio-handoff'
import { consentFields, submittedConsent } from '@/lib/crm/consent'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

/**
 * POST /api/crm/leads
 *
 * Public lead intake endpoint for external sources (Zillow webhooks,
 * portal imports, etc.). Normalizes input, checks for duplicates,
 * and creates or appends to an existing lead.
 *
 * Body: {
 *   name?: string,
 *   firstName?: string,
 *   lastName?: string,
 *   email: string,
 *   phone?: string,
 *   source: string,
 *   sourceDetail?: string,
 *   leadType?: string,
 *   preferredLanguage?: string,
 *   message?: string,
 *   desiredMoveInDate?: string,
 *   monthlyBudgetMin?: number,
 *   monthlyBudgetMax?: number,
 *   propertyExternalId?: string,
 *   propertyAddress?: string,
 *   smsOptIn?: boolean,   // true only if the person ticked an SMS consent box at the source
 *   emailOptIn?: boolean, // true only if the person ticked an email consent box at the source
 *   consentWordingVersion?: string, // the source's own consent wording id, kept as evidence
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.email && !body.phone) {
      return NextResponse.json(
        { error: 'Email or phone is required' },
        { status: 400 },
      )
    }

    const payload: AnyPayload = await getPayload({ config })

    // Normalize inputs
    let firstName = body.firstName || ''
    let lastName = body.lastName || ''
    if (!firstName && body.name) {
      const split = splitName(body.name)
      firstName = split.firstName
      lastName = split.lastName
    }

    const email = body.email ? normalizeEmail(body.email) : ''
    const phone = body.phone ? normalizePhone(body.phone) : ''

    // Check for duplicates
    const existingLeadId = await findDuplicateLead(payload, email || undefined, phone || undefined)

    // External sources have no form of ours; their consent is recorded as given
    // on "crm-api:<source>" with the wording id they send.
    const consentForm = `crm-api:${body.source || 'other'}`
    const consentOptions = {
      wordingVersion:
        typeof body.consentWordingVersion === 'string' && body.consentWordingVersion.trim()
          ? body.consentWordingVersion.trim().slice(0, 100)
          : 'external-unspecified',
    }

    if (existingLeadId) {
      // Append activity to existing lead instead of creating duplicate
      const consent = submittedConsent(body.smsOptIn, body.emailOptIn, consentForm, consentOptions)
      await payload.create({
        collection: 'lead-activities',
        data: {
          lead: existingLeadId,
          type: 'note' as const,
          direction: 'inbound' as const,
          body: [
            `Duplicate inquiry from ${body.source || 'unknown source'}${body.message ? `: ${body.message}` : ''}`,
            consent?.note,
          ].filter(Boolean).join('\n'),
          metadata: {
            source: body.source,
            sourceDetail: body.sourceDetail,
            ...(consent ? { consent: consent.metadata } : {}),
          },
        },
      })

      // Update lastInboundAt
      await payload.update({
        collection: 'leads',
        id: existingLeadId,
        data: { lastInboundAt: new Date().toISOString() },
      })

      return NextResponse.json({
        success: true,
        leadId: existingLeadId,
        duplicate: true,
        message: 'Activity appended to existing lead',
      })
    }

    // Create new lead (cast data to satisfy Payload's strict typing)
    const lead = await payload.create({
      collection: 'leads',
      data: {
        firstName: firstName || 'Unknown',
        lastName: lastName || '',
        email: email || undefined,
        phone: phone || undefined,
        source: (body.source || 'other') as 'website' | 'zillow' | 'apartments_com' | 'facebook' | 'instagram' | 'phone' | 'walk_in' | 'referral' | 'other',
        sourceDetail: body.sourceDetail || undefined,
        leadType: (body.leadType || 'tenant') as 'tenant' | 'owner' | 'vendor' | 'other',
        preferredLanguage: (body.preferredLanguage || 'en') as 'en' | 'es',
        message: body.message || undefined,
        desiredMoveInDate: body.desiredMoveInDate || undefined,
        monthlyBudgetMin: body.monthlyBudgetMin || undefined,
        monthlyBudgetMax: body.monthlyBudgetMax || undefined,
        status: 'new' as const,
        lastInboundAt: new Date().toISOString(),
        ...consentFields(body.smsOptIn, body.emailOptIn, consentForm, consentOptions),
      } as Record<string, unknown>,
    })

    // If property info provided, create a properties-interest record
    if (body.propertyExternalId || body.propertyAddress) {
      await payload.create({
        collection: 'properties-interest',
        data: {
          lead: lead.id,
          propertyExternalId: body.propertyExternalId || '',
          address: body.propertyAddress || '',
          sourceUrl: body.sourceUrl || '',
          status: 'interested' as const,
        },
      })
    }

    // Interim AppFolio handoff: email a formatted guest card to staff for
    // manual entry (guest cards are for prospective tenants). Never throws.
    if ((body.leadType || 'tenant') === 'tenant') {
      await pushToAppFolio(payload, {
        id: lead.id,
        firstName: firstName || 'Unknown',
        lastName,
        email: email || undefined,
        phone: phone || undefined,
        preferredLanguage: body.preferredLanguage,
        source: body.source,
        sourceDetail: body.sourceDetail,
        desiredMoveInDate: body.desiredMoveInDate,
        monthlyBudgetMin: body.monthlyBudgetMin,
        monthlyBudgetMax: body.monthlyBudgetMax,
        message: body.message,
        propertyAddress: body.propertyAddress,
        propertyExternalId: body.propertyExternalId,
        listingUrl: body.sourceUrl,
      })
    }

    return NextResponse.json({
      success: true,
      leadId: lead.id,
      duplicate: false,
      message: 'Lead created',
    })
  } catch (err) {
    console.error('[CRM Lead Intake Error]', err)
    return NextResponse.json(
      { error: 'Failed to process lead', details: String(err) },
      { status: 500 },
    )
  }
}
