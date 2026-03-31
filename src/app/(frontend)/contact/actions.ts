'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { splitName } from '../../../lib/crm/normalization'

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
    const payload = await getPayload({ config })

    const { firstName, lastName } = splitName(name)

    // Map propertyInterest to leadType
    const leadTypeMap: Record<string, string> = {
      owner: 'owner',
      tenant: 'tenant',
      general: 'other',
    }
    const leadType = propertyInterest ? leadTypeMap[propertyInterest] || 'other' : undefined

    await payload.create({
      collection: 'leads',
      data: {
        firstName,
        lastName: lastName || name, // fallback if no last name parsed
        email,
        phone,
        leadType: leadType as 'tenant' | 'owner' | 'vendor' | 'other' | undefined,
        message,
        source: 'website' as const,
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
