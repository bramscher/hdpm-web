'use client'

import { useState } from 'react'
import Button from '@/components/ui/Button'
import { getAttribution } from '@/lib/attribution'
import { trackLead } from '@/lib/analytics'

type Town = 'Bend' | 'Redmond' | 'Sisters' | 'Prineville' | 'Culver' | 'Other'

type PropertyType =
  | 'SFR'
  | 'Apartment'
  | 'Townhouse'
  | 'Duplex'
  | 'Condo'
  | 'Manufactured'
  | 'Other'

const TOWNS: Town[] = ['Bend', 'Redmond', 'Sisters', 'Prineville', 'Culver', 'Other']
const PROPERTY_TYPES: { value: PropertyType; label: string }[] = [
  { value: 'SFR', label: 'Single Family' },
  { value: 'Townhouse', label: 'Townhouse' },
  { value: 'Condo', label: 'Condo' },
  { value: 'Duplex', label: 'Duplex' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Manufactured', label: 'Manufactured' },
  { value: 'Other', label: 'Other' },
]

interface AddressLookupResult {
  formatted_address: string
  city: string
  state: string
  zip: string
  town: Town | null
  property: {
    bedrooms: number | null
    bathrooms: number | null
    sqft: number | null
    property_type: PropertyType | null
    year_built: number | null
  } | null
  sources: string[]
}

export default function OwnerRentalAnalysisForm() {
  // Step 1 — address lookup
  const [addressQuery, setAddressQuery] = useState('')
  const [lookingUp, setLookingUp] = useState(false)
  const [lookupError, setLookupError] = useState<string | null>(null)
  const [lookupResult, setLookupResult] = useState<AddressLookupResult | null>(null)
  const [manualMode, setManualMode] = useState(false)

  // Step 2 — confirm subject property (prefilled from lookup, editable)
  const [address, setAddress] = useState('')
  const [town, setTown] = useState<Town>('Bend')
  const [zipCode, setZipCode] = useState('')
  const [bedrooms, setBedrooms] = useState('3')
  const [bathrooms, setBathrooms] = useState('2')
  const [sqft, setSqft] = useState('')
  const [propertyType, setPropertyType] = useState<PropertyType>('SFR')
  const [currentRent, setCurrentRent] = useState('')

  // Step 3 — contact info
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)

  async function handleLookup() {
    const q = addressQuery.trim()
    if (q.length < 5) {
      setLookupError('Enter a full address (e.g. 123 Main St, Bend, OR)')
      return
    }
    setLookingUp(true)
    setLookupError(null)
    setLookupResult(null)
    try {
      const res = await fetch(
        `/api/owner-intake/address-lookup?address=${encodeURIComponent(q)}`,
      )
      const data = await res.json().catch(() => null)
      if (!res.ok) {
        throw new Error(
          (data && typeof data.error === 'string' && data.error) || 'Lookup failed',
        )
      }
      setLookupResult(data as AddressLookupResult)
    } catch (err) {
      setLookupError(err instanceof Error ? err.message : 'Address lookup failed')
    } finally {
      setLookingUp(false)
    }
  }

  function acceptLookup() {
    if (!lookupResult) return
    setAddress(lookupResult.formatted_address)
    setTown(lookupResult.town || 'Other')
    setZipCode(lookupResult.zip || '')
    if (lookupResult.property?.bedrooms != null) setBedrooms(String(lookupResult.property.bedrooms))
    if (lookupResult.property?.bathrooms != null) setBathrooms(String(lookupResult.property.bathrooms))
    if (lookupResult.property?.sqft != null) setSqft(String(lookupResult.property.sqft))
    if (lookupResult.property?.property_type) setPropertyType(lookupResult.property.property_type)
    setStep(2)
  }

  function startManualEntry() {
    setManualMode(true)
    setAddress(addressQuery)
    setStep(2)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)

    if (!firstName.trim() || !email.trim() || !phone.trim() || !address.trim()) {
      setSubmitError('Name, email, phone, and property address are required.')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/crm/rental-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          message: message.trim() || undefined,
          hp: honeypot || undefined,
          attribution: getAttribution(),
          subject: {
            address: address.trim(),
            town,
            zip_code: zipCode.trim() || undefined,
            bedrooms: bedrooms ? Number(bedrooms) : undefined,
            bathrooms: bathrooms ? Number(bathrooms) : undefined,
            sqft: sqft ? Number(sqft) : undefined,
            property_type: propertyType,
            current_rent: currentRent ? Number(currentRent) : undefined,
            lookup_sources: lookupResult?.sources || [],
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
      if (!honeypot) trackLead('rental_analysis')
      setSubmitted(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-8 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-dark">
          <svg aria-hidden="true" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        <h3 className="font-heading text-heading text-accent-dark">Request Received!</h3>
        <p className="mt-2 text-sm text-neutral-600">
          Our team will prepare your rental analysis and email it to you within one business day.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Address Lookup */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="address-lookup" className="block text-sm font-semibold text-neutral-dark">
              Property Address <span className="text-red-500">*</span>
            </label>
            <p className="mt-1 text-xs text-neutral-mid">
              We&apos;ll auto-fill the property details for you.
            </p>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="address-lookup"
                type="text"
                value={addressQuery}
                onChange={(e) => setAddressQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleLookup()
                  }
                }}
                placeholder="123 NW Franklin Ave, Bend, OR 97703"
                className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                disabled={lookingUp}
              />
              <Button
                type="button"
                onClick={handleLookup}
                disabled={lookingUp || addressQuery.trim().length < 5}
                variant="primary"
                size="md"
                className="disabled:opacity-60 disabled:pointer-events-none"
              >
                {lookingUp ? 'Looking up…' : 'Look Up'}
              </Button>
            </div>
            {lookupError && (
              <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                {lookupError}
              </div>
            )}
          </div>

          {lookupResult && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="flex items-start gap-2">
                <svg aria-hidden="true" className="mt-0.5 h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-dark">{lookupResult.formatted_address}</p>
                  {lookupResult.town ? (
                    <p className="text-xs text-accent">Service area: {lookupResult.town}, OR</p>
                  ) : (
                    <p className="text-xs text-amber-600">
                      Outside our typical service area — we can still review it.
                    </p>
                  )}
                </div>
              </div>

              {lookupResult.property && (
                <div className="mt-3 grid grid-cols-2 gap-3 border-t border-neutral-100 pt-3 sm:grid-cols-4">
                  <Stat label="Bedrooms" value={lookupResult.property.bedrooms ?? '—'} />
                  <Stat label="Bathrooms" value={lookupResult.property.bathrooms ?? '—'} />
                  <Stat label="Sqft" value={lookupResult.property.sqft?.toLocaleString() ?? '—'} />
                  <Stat label="Type" value={lookupResult.property.property_type ?? '—'} />
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={startManualEntry}
                  className="text-sm font-medium text-neutral-mid hover:text-neutral-dark"
                >
                  Enter details manually
                </button>
                <Button type="button" onClick={acceptLookup} variant="primary" size="md">
                  Continue
                </Button>
              </div>
            </div>
          )}

          {!lookupResult && addressQuery.trim().length >= 5 && !lookingUp && (
            <button
              type="button"
              onClick={startManualEntry}
              className="text-sm font-medium text-neutral-mid hover:text-neutral-dark"
            >
              Skip lookup and enter property details manually →
            </button>
          )}
        </div>
      )}

      {/* Step 2: Confirm subject property */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-base font-bold text-neutral-dark">Property Details</h3>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs font-medium text-neutral-mid hover:text-neutral-dark"
              >
                ← Change address
              </button>
            </div>
            <p className="mt-1 text-xs text-neutral-mid">
              Confirm or adjust the property details below.
            </p>
          </div>

          <Field label="Address" required>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Town">
              <select
                value={town}
                onChange={(e) => setTown(e.target.value as Town)}
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {TOWNS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Zip Code">
              <input
                type="text"
                value={zipCode}
                onChange={(e) => setZipCode(e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 px-3 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </Field>
            <Field label="Property Type">
              <select
                value={propertyType}
                onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                {PROPERTY_TYPES.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Bedrooms">
              <select
                value={bedrooms}
                onChange={(e) => setBedrooms(e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 bg-white px-3 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              >
                <option value="0">Studio</option>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </Field>
            <Field label="Bathrooms">
              <input
                type="number"
                step="0.5"
                min="0"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 px-3 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </Field>
            <Field label="Sqft">
              <input
                type="number"
                min="0"
                value={sqft}
                onChange={(e) => setSqft(e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 px-3 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                placeholder="—"
              />
            </Field>
            <Field label="Current Rent">
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-mid">$</span>
                <input
                  type="number"
                  min="0"
                  value={currentRent}
                  onChange={(e) => setCurrentRent(e.target.value)}
                  placeholder="Optional"
                  className="block w-full rounded-lg border border-neutral-300 px-3 py-3 pl-7 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                />
              </div>
            </Field>
          </div>

          <div className="flex justify-end">
            <Button
              type="button"
              onClick={() => setStep(3)}
              disabled={!address.trim()}
              variant="primary"
              size="md"
              className="disabled:opacity-60 disabled:pointer-events-none"
            >
              Continue →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Contact info */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-base font-bold text-neutral-dark">Your Contact Info</h3>
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs font-medium text-neutral-mid hover:text-neutral-dark"
            >
              ← Property details
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="First Name" required>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </Field>
            <Field label="Last Name">
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
              />
            </Field>
          </div>

          <Field label="Email" required>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </Field>

          <Field label="Phone" required>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="(541) 555-0123"
              className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </Field>

          {/* Honeypot — hidden from real users, bots fill it. Neutral naming
              so browser address-autofill never populates it. */}
          <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="ra-hp-check">Leave this field empty</label>
            <input
              id="ra-hp-check"
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <Field label="Anything else we should know?">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Timeline, condition notes, current lease situation, etc."
              className="block w-full rounded-lg border border-neutral-300 px-4 py-3 text-neutral-dark shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </Field>

          {submitError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {submitError}
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
          <p className="text-center text-xs text-neutral-mid">
            We&apos;ll review your property and email a full rent analysis within one business day.
          </p>
        </div>
      )}
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-neutral-dark">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-wider text-neutral-mid">{label}</p>
      <p className="text-sm font-semibold text-neutral-dark">{value}</p>
    </div>
  )
}
