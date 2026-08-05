'use client'

import { useActionState, useEffect, useState } from 'react'
import Button from '@/components/ui/Button'
import { submitContactForm, type ContactFormState } from '@/app/(frontend)/contact/actions'
import { getAttribution, type Attribution } from '@/lib/attribution'
import { trackLead } from '@/lib/analytics'

const initialState: ContactFormState = {
  success: false,
  error: null,
}

export default function ContactForm() {
  const [state, formAction, isPending] = useActionState(submitContactForm, initialState)
  const [attribution, setAttribution] = useState<Attribution>({})
  const [honeypot, setHoneypot] = useState('')

  useEffect(() => {
    setAttribution(getAttribution())
  }, [])

  useEffect(() => {
    // Don't count honeypot-caught (pretend-success) submissions as conversions
    if (state.success && !honeypot) trackLead('contact')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success])

  if (state.success) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
          <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-heading text-heading text-accent-dark">Message Sent!</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Thank you for reaching out. Our team will get back to you within one business day.
        </p>
      </div>
    )
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Honeypot — hidden from real users, bots fill it. Neutral naming so
          browser address-autofill never populates it. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor="contact-hp-check">Leave this field empty</label>
        <input
          id="contact-hp-check"
          type="text"
          name="hp_check"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {/* Attribution (first-touch UTM/referrer, captured client-side) */}
      {Object.entries(attribution).map(([key, value]) =>
        value ? <input key={key} type="hidden" name={key} value={value} /> : null,
      )}

      {state.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-neutral-dark">
          Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Your full name"
        />
      </div>

      {/* Email */}
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-neutral-dark">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          id="email"
          name="email"
          required
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="you@example.com"
        />
      </div>

      {/* Phone */}
      <div>
        <label htmlFor="phone" className="block text-sm font-semibold text-neutral-dark">
          Phone
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="(541) 555-0123"
        />
      </div>

      {/* Property Interest */}
      <div>
        <label htmlFor="propertyInterest" className="block text-sm font-semibold text-neutral-dark">
          I am a...
        </label>
        <select
          id="propertyInterest"
          name="propertyInterest"
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="">Select an option</option>
          <option value="owner">Property Owner</option>
          <option value="tenant">Prospective Tenant</option>
          <option value="general">General Inquiry</option>
        </select>
      </div>

      {/* Message */}
      <div>
        <label htmlFor="message" className="block text-sm font-semibold text-neutral-dark">
          Message <span className="text-red-500">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="mt-1.5 block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="How can we help you?"
        />
      </div>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="lg"
        withArrow={!isPending}
        disabled={isPending}
        className="w-full disabled:opacity-60 disabled:pointer-events-none"
      >
        {isPending ? (
          <>
            <svg aria-hidden="true" className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Sending...
          </>
        ) : (
          'Send Message'
        )}
      </Button>
    </form>
  )
}
