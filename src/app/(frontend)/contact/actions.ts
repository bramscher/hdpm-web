'use server'

import { getPayload } from 'payload'
import config from '@payload-config'

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

    await payload.create({
      collection: 'leads',
      data: {
        name,
        email,
        phone,
        propertyInterest: propertyInterest as 'owner' | 'tenant' | 'general' | undefined,
        message,
        source: 'contact-page',
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
