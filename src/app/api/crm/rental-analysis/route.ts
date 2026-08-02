import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { normalizeEmail, normalizePhone, splitName } from '@/lib/crm/normalization'
import { findDuplicateLead } from '@/lib/crm/dedup'
import { sendLeadNotification } from '@/lib/notify'
import type { Attribution } from '@/lib/attribution'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyPayload = any

const CHATBOT_BASE_URL = process.env.HDPM_CHATBOT_BASE_URL || ''
const SERVICE_TOKEN = process.env.HDPM_SERVICE_TOKEN || ''

interface SubjectPropertyInput {
  address?: string
  town?: string
  zip_code?: string
  bedrooms?: number
  bathrooms?: number
  sqft?: number
  property_type?: string
  amenities?: string[]
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
  /** honeypot — real users never fill this */
  company?: string
}

/**
 * POST /api/crm/rental-analysis
 *
 * Public intake endpoint for owner rental analysis requests.
 * 1. Normalize + dedupe → upsert Lead (leadType=owner, source=website).
 * 2. Save subject property + lookup sources to the Lead.
 * 3. Forward the request to hdpm-chatbot for operator review.
 * 4. Persist the returned rent_analyses UUID on the Lead.
 */
export async function POST(req: NextRequest) {
  let body: RentalAnalysisRequestBody
  try {
    body = (await req.json()) as RentalAnalysisRequestBody
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Honeypot: bots fill every field. Pretend success, create nothing.
  if (body.company) {
    return NextResponse.json({ ok: true })
  }

  if (!body.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }
  if (!body.phone?.trim()) {
    return NextResponse.json({ error: 'Phone is required' }, { status: 400 })
  }
  if (!body.subject?.address) {
    return NextResponse.json(
      { error: 'Subject property address is required' },
      { status: 400 },
    )
  }

  const email = normalizeEmail(body.email)
  const phone = body.phone ? normalizePhone(body.phone) : undefined
  const { firstName, lastName } = body.firstName || body.lastName
    ? { firstName: body.firstName || '', lastName: body.lastName || '' }
    : splitName(body.name || '')

  if (!firstName) {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  }

  const subject = body.subject
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

  const payload: AnyPayload = await getPayload({ config })

  try {
    // 1. Upsert lead
    const duplicateId = await findDuplicateLead(payload, email, phone)
    let leadId: number

    if (duplicateId) {
      const updated = await payload.update({
        collection: 'leads',
        id: duplicateId,
        data: {
          firstName,
          lastName,
          phone,
          leadType: 'owner',
          source: 'website',
          sourceDetail: 'Rental Analysis form',
          subjectProperty,
          rentAnalysisStatus: 'requested',
          message: body.message || undefined,
          attribution: body.attribution || undefined,
        },
      })
      leadId = updated.id as number
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
          sourceDetail: 'Rental Analysis form',
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

    if (CHATBOT_BASE_URL && SERVICE_TOKEN) {
      try {
        const forwardRes = await fetch(
          `${CHATBOT_BASE_URL.replace(/\/$/, '')}/api/intake/rental-analysis-request`,
          {
            method: 'POST',
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
    } else {
      forwardError = 'HDPM_CHATBOT_BASE_URL or HDPM_SERVICE_TOKEN not configured'
      console.warn('[rental-analysis]', forwardError)
    }

    // 3. Notify the monitored inbox. If the chatbot handoff failed, say so
    // prominently — the owner was promised an analysis within one business
    // day and someone must run it manually.
    const attribution = body.attribution || {}
    await sendLeadNotification({
      subject: `New Rental Analysis request — ${subject.address}`,
      warning: forwardError
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

    return NextResponse.json({
      ok: true,
      lead_id: leadId,
      rent_analysis_id: rentAnalysisId,
      forwarded: rentAnalysisId !== null,
      forward_error: forwardError,
    })
  } catch (err) {
    console.error('[rental-analysis] failed:', err)
    return NextResponse.json(
      { error: 'Failed to submit rental analysis request' },
      { status: 500 },
    )
  }
}
