import assert from 'node:assert/strict'
import test from 'node:test'
import type { Field, Payload } from 'payload'
import { Leads } from '../src/collections/Leads'
import { explicitConsent } from '../src/lib/crm/consent'
import { createRentalAnalysisHandler } from '../src/lib/crm/rental-analysis-intake'

function findField(fields: Field[], name: string): Record<string, unknown> | undefined {
  for (const field of fields as Array<Record<string, any>>) {
    if (field.name === name) return field
    const nested = [field.fields, ...(field.tabs ?? []).map((tab: { fields: Field[] }) => tab.fields)]
    for (const list of nested) {
      const found = Array.isArray(list) ? findField(list, name) : undefined
      if (found) return found
    }
  }
  return undefined
}

test('new leads are not opted in to SMS or email by default', () => {
  assert.equal(findField(Leads.fields, 'smsOptIn')?.defaultValue, false)
  assert.equal(findField(Leads.fields, 'emailOptIn')?.defaultValue, false)
})

test('only an explicit tick counts as consent', () => {
  assert.equal(explicitConsent(true), true)
  assert.equal(explicitConsent('on'), true) // a checked HTML checkbox
  for (const value of [undefined, null, false, '', 'false', 'off', 'yes', 'true', 1, {}])
    assert.equal(explicitConsent(value), false, `rejects ${JSON.stringify(value)}`)
})

const submission = {
  name: 'Test Owner',
  email: 'owner@example.com',
  phone: '(541) 555-0100',
  subject: { address: '100 Example St', town: 'Bend' },
}

async function createdLead(extra: Record<string, unknown>) {
  const writes: Array<{ collection: string; data: Record<string, unknown> }> = []
  const payload = {
    find: async () => ({ docs: [] }),
    create: async (write: { collection: string; data: Record<string, unknown> }) => {
      writes.push(write)
      return { id: 1, ...write.data }
    },
    update: async () => ({}),
  } as unknown as Payload
  const handler = createRentalAnalysisHandler({
    getPayload: async () => payload,
    sendLeadNotification: async () => true,
    fetch: async () => Response.json({ id: 'analysis' }),
    chatbotBaseUrl: '',
    serviceToken: '',
  })
  const response = await handler(new Request('https://example.com/api/crm/rental-analysis', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...submission, ...extra }),
  }))
  assert.equal(response.status, 200)
  return writes.find((w) => w.collection === 'leads')!.data
}

test('a rental analysis request without consent ticks is not opted in', async () => {
  const lead = await createdLead({})
  assert.equal(lead.smsOptIn, false)
  assert.equal(lead.emailOptIn, false)
})

test('a rental analysis request opts in only to what was ticked', async () => {
  const lead = await createdLead({ smsConsent: true, emailConsent: 'yes' })
  assert.equal(lead.smsOptIn, true)
  assert.equal(lead.emailOptIn, false)
})

test('consent evidence is recorded only for ticked boxes', async () => {
  const { consentFields } = await import('../src/lib/crm/consent')
  const { CONSENT_WORDING_VERSION } = await import('../src/lib/crm/consent-wording')
  const now = new Date('2026-11-06T12:00:00.000Z')
  const at = now.toISOString()
  assert.deepEqual(consentFields(undefined, undefined, 'contact-form', { now }), {
    smsOptIn: false, emailOptIn: false, smsConsentAt: null, emailConsentAt: null,
    consentForm: null, consentWordingVersion: null,
  })
  assert.deepEqual(consentFields('on', undefined, 'contact-form', { now }), {
    smsOptIn: true, emailOptIn: false, smsConsentAt: at, emailConsentAt: null,
    consentForm: 'contact-form', consentWordingVersion: CONSENT_WORDING_VERSION,
  })
  assert.deepEqual(consentFields(null, 'on', 'listing-inquiry', { now }), {
    smsOptIn: false, emailOptIn: true, smsConsentAt: null, emailConsentAt: at,
    consentForm: 'listing-inquiry', consentWordingVersion: CONSENT_WORDING_VERSION,
  })
  assert.deepEqual(consentFields(true, true, 'crm-api:zillow', { now, wordingVersion: 'zillow-v3' }), {
    smsOptIn: true, emailOptIn: true, smsConsentAt: at, emailConsentAt: at,
    consentForm: 'crm-api:zillow', consentWordingVersion: 'zillow-v3',
  })
})

test('a rental analysis request records evidence for each ticked box', async () => {
  const none = await createdLead({ smsConsent: false, emailConsent: false })
  assert.deepEqual([none.smsOptIn, none.emailOptIn, none.smsConsentAt, none.consentForm], [false, false, null, null])
  const both = await createdLead({ smsConsent: true, emailConsent: true })
  assert.equal(both.smsOptIn, true)
  assert.equal(both.emailOptIn, true)
  assert.ok(Number.isFinite(Date.parse(String(both.smsConsentAt))))
  assert.ok(Number.isFinite(Date.parse(String(both.emailConsentAt))))
  assert.equal(both.consentForm, 'rental-analysis')
  const emailOnly = await createdLead({ emailConsent: true })
  assert.deepEqual([emailOnly.smsOptIn, emailOnly.emailOptIn, emailOnly.smsConsentAt], [false, true, null])
})

test('the consent wording names HDPM, the channel, opt-out and that consent is optional', async () => {
  const { SMS_CONSENT_TEXT, EMAIL_CONSENT_TEXT } = await import('../src/lib/crm/consent-wording')
  for (const text of [SMS_CONSENT_TEXT, EMAIL_CONSENT_TEXT]) {
    assert.match(text, /High Desert Property Management/)
    assert.match(text, /not a condition of service/)
  }
  assert.match(SMS_CONSENT_TEXT, /Reply STOP/)
  assert.match(SMS_CONSENT_TEXT, /Msg & data rates may apply/)
  assert.match(SMS_CONSENT_TEXT, /frequency/i)
  assert.match(EMAIL_CONSENT_TEXT, /unsubscribe/i)
})
