'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { findDuplicateLead } from '@/lib/crm/dedup'
import { normalizeEmail, normalizePhone, splitName } from '@/lib/crm/normalization'
import { pushToAppFolio } from '@/lib/crm/appfolio-handoff'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

export type ListingInquiryState = {
  success: boolean
  error: string | null
}

/**
 * Handle a "Request info / I'm interested" submission from a listing detail
 * page. Creates (or appends to) a tenant lead, records the property interest,
 * and emails a formatted guest card to staff for manual AppFolio entry (via
 * pushToAppFolio — the interim handoff until AppFolio grants write access).
 */
export async function submitListingInquiry(
  _prevState: ListingInquiryState,
  formData: FormData,
): Promise<ListingInquiryState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = (formData.get('phone') as string) || undefined
  const message = (formData.get('message') as string) || ''
  const desiredMoveInDate = (formData.get('desiredMoveInDate') as string) || undefined

  // Property context (hidden fields injected by the form)
  const propertyExternalId = (formData.get('propertyExternalId') as string) || undefined
  const propertyAddress = (formData.get('propertyAddress') as string) || undefined
  const listingUrl = (formData.get('listingUrl') as string) || undefined

  // Honeypot: bots fill every field. Pretend success, create nothing.
  if (formData.get('hp_check')) {
    return { success: true, error: null }
  }

  const attribution = {
    utmSource: (formData.get('utmSource') as string) || undefined,
    utmMedium: (formData.get('utmMedium') as string) || undefined,
    utmCampaign: (formData.get('utmCampaign') as string) || undefined,
    utmTerm: (formData.get('utmTerm') as string) || undefined,
    utmContent: (formData.get('utmContent') as string) || undefined,
    referrer: (formData.get('referrer') as string) || undefined,
    landingPage: (formData.get('landingPage') as string) || undefined,
  }

  if (!name || !email) {
    return { success: false, error: 'Please provide your name and email.' }
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    const payload: AnyPayload = await getPayload({ config })

    const { firstName, lastName } = splitName(name)
    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = phone ? normalizePhone(phone) : undefined

    const propertyLabel = propertyAddress || propertyExternalId || 'a listing'
    const existingLeadId = await findDuplicateLead(payload, normalizedEmail, normalizedPhone)

    let leadId: number
    if (existingLeadId) {
      leadId = existingLeadId
      await payload.create({
        collection: 'lead-activities',
        data: {
          lead: existingLeadId,
          type: 'note' as const,
          direction: 'inbound' as const,
          body: `Listing inquiry — ${propertyLabel}${message ? `: ${message}` : ''}`,
          metadata: { source: 'website', propertyExternalId, propertyAddress },
        },
      })
      await payload.update({
        collection: 'leads',
        id: existingLeadId,
        data: { lastInboundAt: new Date().toISOString() },
      })
    } else {
      const created = await payload.create({
        collection: 'leads',
        data: {
          firstName,
          lastName: lastName || '—',
          email: normalizedEmail,
          phone: normalizedPhone,
          leadType: 'tenant' as const,
          message: message || undefined,
          desiredMoveInDate: desiredMoveInDate || undefined,
          source: 'website' as const,
          sourceDetail: `Listing inquiry — ${propertyLabel}`,
          lastInboundAt: new Date().toISOString(),
          attribution,
        },
      })
      leadId = created.id
    }

    // Record the property interest
    if (propertyExternalId || propertyAddress) {
      await payload.create({
        collection: 'properties-interest',
        data: {
          lead: leadId,
          propertyExternalId: propertyExternalId || '',
          address: propertyAddress || '',
          sourceUrl: listingUrl || '',
          status: 'interested' as const,
        },
      })
    }

    // Interim AppFolio handoff: email a formatted guest card to staff.
    await pushToAppFolio(payload, {
      id: leadId,
      firstName,
      lastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      preferredLanguage: 'en',
      source: 'website',
      sourceDetail: 'Listing inquiry',
      desiredMoveInDate,
      message,
      propertyAddress,
      propertyExternalId,
      listingUrl,
    })

    return { success: true, error: null }
  } catch (err) {
    console.error('Failed to submit listing inquiry:', err)
    return {
      success: false,
      error: 'Something went wrong. Please try again or call us directly.',
    }
  }
}
