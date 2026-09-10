import type { Payload } from 'payload'
import { normalizeEmail, normalizePhone, splitName } from '@/lib/crm/normalization'
import { findDuplicateLead } from '@/lib/crm/dedup'
import type { LeadNotification } from '@/lib/notify'
import type { Attribution } from '@/lib/attribution'
import type { Lead } from '@/payload-types'

type SubjectProperty = NonNullable<Lead['subjectProperty']>

interface IntakeDependencies {
  getPayload: () => Promise<Payload>
  sendLeadNotification: (notification: LeadNotification) => Promise<boolean>
  fetch: typeof globalThis.fetch
  chatbotBaseUrl: string
  serviceToken: string
}

interface SubjectPropertyInput {
  address?: string
  town?: NonNullable<SubjectProperty['town']>
  zip_code?: string
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  property_type?: NonNullable<SubjectProperty['propertyType']>
  amenities?: NonNullable<SubjectProperty['amenities']>
  current_rent?: number
  lookup_sources?: string[]
}

interface RentalAnalysisRequestBody {
  name?: string
  firstName?: string
  lastName?: string
  email: string
  phone?: string
  message?: string
  subject: SubjectPropertyInput
  attribution?: Attribution
  /** where on the site the lead came from, e.g. "Market page: Bend" */
  source_detail?: string
  /** honeypot — real users never fill this */
  hp?: string
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function optionalText(value: unknown, maxLength: number): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= maxLength)
}

function optionalNumber(value: unknown): boolean {
  return value === undefined || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
}

function optionalTextArray(value: unknown): boolean {
  return value === undefined || (
    Array.isArray(value) && value.length <= 50 &&
    value.every((item) => typeof item === 'string' && item.length <= 200)
  )
}

/** Validate before normalization or any writes; JSON types are untrusted. */
function isRentalAnalysisRequest(value: unknown): value is RentalAnalysisRequestBody {
  if (!isObject(value) || !isObject(value.subject)) return false
  const textFields = ['name', 'firstName', 'lastName', 'email', 'phone', 'message', 'source_detail', 'hp']
  if (!textFields.every((key) => optionalText(value[key], 10000))) return false
  if (typeof value.email !== 'string') return false

  const subject = value.subject
  if (!['address', 'town', 'zip_code', 'property_type'].every((key) => optionalText(subject[key], 1000))) return false
  if (!['bedrooms', 'bathrooms', 'sqft', 'current_rent'].every((key) => optionalNumber(subject[key]))) return false
  const towns = ['Bend', 'Redmond', 'Sisters', 'Prineville', 'Culver', 'Other']
  const propertyTypes = ['SFR', 'Apartment', 'Townhouse', 'Duplex', 'Condo', 'Manufactured', 'Other']
  if (subject.town && !towns.includes(subject.town as string)) return false
  if (subject.property_type && !propertyTypes.includes(subject.property_type as string)) return false
  if (!['amenities', 'lookup_sources'].every((key) => optionalTextArray(subject[key]))) return false
  const amenities = [
    'garage', 'pool', 'ac', 'washer_dryer', 'dishwasher', 'fenced_yard',
    'pet_friendly', 'fireplace', 'updated_kitchen', 'new_flooring',
  ]
  if (Array.isArray(subject.amenities) && !subject.amenities.every((item) => amenities.includes(item))) return false

  if (value.attribution !== undefined) {
    if (!isObject(value.attribution)) return false
    const attributionFields = ['utmSource', 'utmMedium', 'utmCampaign', 'utmTerm', 'utmContent', 'referrer', 'landingPage']
    if (!Object.entries(value.attribution).every(([key, item]) =>
      attributionFields.includes(key) && typeof item === 'string' && item.length <= 2000,
    )) return false
  }
  return true
}

/**
 * POST /api/crm/rental-analysis
 *
 * Public intake endpoint for owner rental analysis requests.
 * Existing email/phone matches are unverified requests for staff review.
 * They never replace existing contact/property data or trigger a new chatbot
 * handoff. New contacts retain the normal owner-lead and analysis flow.
 */
export function createRentalAnalysisHandler(deps: IntakeDependencies) {
  const {
    getPayload,
    sendLeadNotification,
    fetch,
    chatbotBaseUrl: CHATBOT_BASE_URL,
    serviceToken: SERVICE_TOKEN,
  } = deps
  return async function POST(req: Request) {
    let input: unknown
    try {
      input = await req.json()
    } catch {
      return Response.json({ error: 'Invalid JSON' }, { status: 400 })
    }

    // Honeypot: bots fill every field. Pretend success, create nothing.
    if (isObject(input) && typeof input.hp === 'string' && input.hp) {
      return Response.json({ ok: true })
    }

    if (!isRentalAnalysisRequest(input)) {
      return Response.json({ error: 'Invalid rental analysis request' }, { status: 400 })
    }
    const body = input

    if (!body.email) {
      return Response.json({ error: 'Email is required' }, { status: 400 })
    }
    if (!body.phone?.trim()) {
      return Response.json({ error: 'Phone is required' }, { status: 400 })
    }
    if (!body.subject.address?.trim()) {
      return Response.json(
        { error: 'Subject property address is required' },
        { status: 400 },
      )
    }

    const email = normalizeEmail(body.email)
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'A valid email is required' }, { status: 400 })
    }
    const phone = normalizePhone(body.phone)
    if (!phone) {
      return Response.json({ error: 'A valid phone is required' }, { status: 400 })
    }
    const parsedName = body.firstName || body.lastName
      ? { firstName: body.firstName?.trim() || '', lastName: body.lastName?.trim() || '' }
      : splitName(body.name || '')
    const firstName = parsedName.firstName
    // Leads.lastName is required — single-word names would otherwise fail
    // Payload validation and 500 the whole submission
    const lastName = parsedName.lastName || '—'

    if (!firstName) {
      return Response.json({ error: 'Name is required' }, { status: 400 })
    }

    const subject = { ...body.subject, address: body.subject.address.trim() }
    const subjectProperty = {
      address: subject.address,
      town: subject.town || 'Other',
      zipCode: subject.zip_code,
      bedrooms: typeof subject.bedrooms === 'number' ? subject.bedrooms : undefined,
      bathrooms: typeof subject.bathrooms === 'number' ? subject.bathrooms : undefined,
      sqft: typeof subject.sqft === 'number' ? subject.sqft : undefined,
      propertyType: subject.property_type || undefined,
      currentRent: typeof subject.current_rent === 'number' ? subject.current_rent : undefined,
      amenities: subject.amenities || [],
      lookupSources: subject.lookup_sources || [],
    }

    try {
      const payload = await getPayload()
      // 1. Record an unverified repeat request, or create a new owner lead
      const duplicateId = await findDuplicateLead(payload, email, phone)
      let leadId: number

      if (duplicateId) {
        // An email/phone match is a routing hint, not proof of identity. Keep
        // all established lead fields and any previous analysis untouched.
        await payload.create({
          collection: 'lead-activities',
          data: {
            lead: duplicateId,
            type: 'note',
            direction: 'inbound',
            body: [
              'Rental analysis request — unverified repeat contact; staff review required.',
              `Submitted name: ${firstName} ${lastName}`,
              `Submitted email: ${email}`,
              `Submitted phone: ${phone}`,
              `Submitted property: ${subject.address}`,
              body.message ? `Message: ${body.message}` : '',
              'Existing contact and analysis details were preserved. Verify the request before changing them or starting an analysis.',
            ].filter(Boolean).join('\n'),
            metadata: {
              kind: 'rental_analysis_request',
              reviewStatus: 'pending',
              contactVerified: false,
              contact: { firstName, lastName, email, phone },
              subjectProperty,
              message: body.message,
              source: 'website',
              sourceDetail: body.source_detail || 'Rental Analysis form',
              attribution: body.attribution,
            },
          },
        })
        leadId = duplicateId
      } else {
        const created = await payload.create({
          collection: 'leads',
          data: {
            firstName,
            lastName,
            email,
            phone,
            leadType: 'owner',
            source: 'website',
            sourceDetail: body.source_detail || 'Rental Analysis form',
            status: 'new',
            subjectProperty,
            rentAnalysisStatus: 'requested',
            message: body.message || undefined,
            attribution: body.attribution || undefined,
          },
        })
        leadId = created.id as number
      }

      // 2. Forward to hdpm-chatbot for operator review
      let rentAnalysisId: string | null = null
      let forwardError: string | null = null

      // A chatbot handoff keyed by an existing lead could overwrite its
      // analysis via the service callback. Only forward newly created leads.
      if (!duplicateId && CHATBOT_BASE_URL && SERVICE_TOKEN) {
        try {
          const forwardRes = await fetch(
            `${CHATBOT_BASE_URL.replace(/\/$/, '')}/api/intake/rental-analysis-request`,
            {
              method: 'POST',
              signal: AbortSignal.timeout(15000),
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${SERVICE_TOKEN}`,
              },
              body: JSON.stringify({
                source_app: 'hdpm-web',
                lead_id: leadId,
                contact: {
                  first_name: firstName,
                  last_name: lastName,
                  email,
                  phone,
                },
                subject: {
                  address: subject.address,
                  town: subject.town || 'Other',
                  zip_code: subject.zip_code,
                  bedrooms: subject.bedrooms,
                  bathrooms: subject.bathrooms,
                  sqft: subject.sqft,
                  property_type: subject.property_type,
                  amenities: subject.amenities,
                  current_rent: subject.current_rent,
                },
                message: body.message,
              }),
            },
          )

          if (forwardRes.ok) {
            const data = (await forwardRes.json()) as { id?: string }
            rentAnalysisId = data.id || null
            if (rentAnalysisId) {
              await payload.update({
                collection: 'leads',
                id: leadId,
                data: { rentAnalysisId },
              })
            }
          } else {
            const text = await forwardRes.text()
            forwardError = `chatbot ${forwardRes.status}: ${text.slice(0, 200)}`
            console.error('[rental-analysis] forward failed:', forwardError)
          }
        } catch (err) {
          forwardError = err instanceof Error ? err.message : String(err)
          console.error('[rental-analysis] forward exception:', err)
        }
      } else if (!duplicateId) {
        forwardError = 'HDPM_CHATBOT_BASE_URL or HDPM_SERVICE_TOKEN not configured'
        console.warn('[rental-analysis]', forwardError)
      }

      // 3. Notify the monitored inbox. If the chatbot handoff failed, say so
      // prominently — the owner was promised an analysis within one business
      // day and someone must run it manually.
      const attribution = body.attribution || {}
      await sendLeadNotification({
        to: 'matt@highdesertpm.com,craig@highdesertpm.com',
        subject: `New Rental Analysis request — ${subject.address}`,
        warning: duplicateId
          ? 'REVIEW REQUIRED: This unverified submission matches an existing CRM contact. The full request was saved as an inbound activity; existing details and analysis were preserved. No chatbot handoff was made. Verify the requester through the established contact details and arrange the analysis within one business day.'
          : forwardError
            ? `Handoff to the analysis system FAILED (${forwardError}). Run this analysis manually — the owner was told to expect it within one business day.`
            : undefined,
        fields: [
          ['Name', `${firstName} ${lastName}`.trim()],
          ['Email', email],
          ['Phone', phone],
          ['Property', subject.address],
          ['Town', subject.town],
          ['Beds / Baths / Sqft', `${subject.bedrooms ?? '—'} / ${subject.bathrooms ?? '—'} / ${subject.sqft ?? '—'}`],
          ['Property type', subject.property_type],
          ['Current rent', subject.current_rent ? `$${subject.current_rent}` : undefined],
          ['Message', body.message],
          ['UTM source / medium', [attribution.utmSource, attribution.utmMedium].filter(Boolean).join(' / ')],
          ['UTM campaign', attribution.utmCampaign],
          ['Referrer', attribution.referrer],
          ['Landing page', attribution.landingPage],
          ['CRM lead ID', leadId],
        ],
      })

      // Do not reveal CRM identifiers, match results, or internal service errors.
      return Response.json({ ok: true })
    } catch (err) {
      console.error('[rental-analysis] failed:', err)
      return Response.json(
        { error: 'Failed to submit rental analysis request' },
        { status: 500 },
      )
    }
  }
}
