'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { getAttribution } from '@/lib/attribution'
import { trackLead } from '@/lib/analytics'

interface LeadFormProps {
  /** Pre-filled town for market pages (hidden from the user) */
  town?: string
  /** Recorded on the lead, e.g. "Market page: Bend" or "Blog post: <slug>" */
  sourceDetail: string
  /** GA event form tag, e.g. "market_bend" or "blog_post" */
  analyticsTag: string
  /** Optional heading shown above the fields */
  heading?: string
  subheading?: string
  /** Dark variant for use on dark section backgrounds */
  dark?: boolean
}

/**
 * Compact four-field lead form (name, email, phone, property address) that
 * feeds the same rental-analysis pipeline as the /owners wizard — CRM lead,
 * chatbot handoff, email notification, attribution.
 */
export default function LeadForm({
  town,
  sourceDetail,
  analyticsTag,
  heading = 'Get Your Free Rental Analysis',
  subheading = 'Find out what your property could earn. No obligation — we’ll email you a full rent analysis within one business day.',
  dark = false,
}: LeadFormProps) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const labelClass = `block text-sm font-semibold ${dark ? 'text-white' : 'text-neutral-dark'}`
  const inputClass =
    'mt-1.5 block w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!name.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setError('All four fields are required.')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/crm/rental-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          hp: honeypot || undefined,
          source_detail: sourceDetail,
          attribution: getAttribution(),
          subject: {
            address: address.trim(),
            town: town || undefined,
          },
        }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(
          (data && typeof data.error === 'string' && data.error) ||
            'Submission failed. Please try again or call us.',
        )
      }
      if (!honeypot) trackLead(analyticsTag)
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-8 text-center">
        <h3 className="font-heading text-heading text-accent-dark">
          Request Received!
        </h3>
        <p className="mt-2 text-sm text-neutral-600">
          We&apos;ll review your property and email a full rent analysis within
          one business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3
          className={`font-heading text-subtitle ${dark ? 'text-white' : 'text-neutral-dark'}`}
        >
          {heading}
        </h3>
        <p className={`mt-2 text-sm leading-relaxed ${dark ? 'text-white/80' : 'text-neutral-mid'}`}>
          {subheading}
        </p>
      </div>

      {/* Honeypot — hidden from real users, bots fill it. Neutral naming so
          browser address-autofill never populates it. */}
      <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
        <label htmlFor={`hp-check-${analyticsTag}`}>Leave this field empty</label>
        <input
          id={`hp-check-${analyticsTag}`}
          type="text"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={`lf-name-${analyticsTag}`} className={labelClass}>
            Full Name <span className="text-red-500">*</span>
          </label>
          <input
            id={`lf-name-${analyticsTag}`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`lf-phone-${analyticsTag}`} className={labelClass}>
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            id={`lf-phone-${analyticsTag}`}
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            placeholder="(541) 555-0123"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor={`lf-email-${analyticsTag}`} className={labelClass}>
          Email <span className="text-red-500">*</span>
        </label>
        <input
          id={`lf-email-${analyticsTag}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor={`lf-address-${analyticsTag}`} className={labelClass}>
          Property Address <span className="text-red-500">*</span>
        </label>
        <input
          id={`lf-address-${analyticsTag}`}
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          placeholder="123 NW Franklin Ave, Bend, OR 97703"
          className={inputClass}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={submitting}
        className="w-full disabled:opacity-60 disabled:pointer-events-none"
      >
        {submitting ? 'Submitting…' : 'Get My Free Rental Analysis'}
      </Button>
      <p className={`text-center text-xs ${dark ? 'text-white/60' : 'text-neutral-mid'}`}>
        Prefer to talk? Call{' '}
        <a href="tel:+15415480383" className="font-semibold underline">
          (541) 548-0383
        </a>
      </p>
    </form>
  )
}
