'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { findDuplicateLead } from '@/lib/crm/dedup'
import { normalizeEmail, normalizePhone, splitName } from '../../../lib/crm/normalization'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

export type ContactFormState = {
  success: boolean
  error: string | null
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const phone = (formData.get('phone') as string) || undefined
  const propertyInterest = (formData.get('propertyInterest') as string) || undefined
  const message = formData.get('message') as string

  // Basic validation
  if (!name || !email || !message) {
    return { success: false, error: 'Please fill in all required fields.' }
  }

  // Simple email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { success: false, error: 'Please enter a valid email address.' }
  }

  try {
    const payload: AnyPayload = await getPayload({ config })

    const { firstName, lastName } = splitName(name)
    const normalizedEmail = normalizeEmail(email)
    const normalizedPhone = phone ? normalizePhone(phone) : undefined

    // Map propertyInterest to leadType
    const leadTypeMap: Record<string, string> = {
      owner: 'owner',
      tenant: 'tenant',
      general: 'other',
    }
    const leadType = propertyInterest ? leadTypeMap[propertyInterest] || 'other' : undefined
    const existingLeadId = await findDuplicateLead(payload, normalizedEmail, normalizedPhone)

    if (existingLeadId) {
      await payload.create({
        collection: 'lead-activities',
        data: {
          lead: existingLeadId,
          type: 'note' as const,
          direction: 'inbound' as const,
          body: `Website contact form inquiry${message ? `: ${message}` : ''}`,
          metadata: {
            source: 'website',
            propertyInterest: propertyInterest || undefined,
          },
        },
      })

      await payload.update({
        collection: 'leads',
        id: existingLeadId,
        data: { lastInboundAt: new Date().toISOString() },
      })

      return { success: true, error: null }
    }

    await payload.create({
      collection: 'leads',
      data: {
        firstName,
        lastName: lastName || '—', // fallback when only one name was provided
        email: normalizedEmail,
        phone: normalizedPhone,
        leadType: leadType as 'tenant' | 'owner' | 'vendor' | 'other' | undefined,
        message,
        source: 'website' as const,
        lastInboundAt: new Date().toISOString(),
      },
    })

    // TODO: Add Resend email notification here

    return { success: true, error: null }
  } catch (err) {
    console.error('Failed to create lead:', err)
    return {
      success: false,
      error: 'Something went wrong. Please try again or call us directly.',
    }
  }
}
