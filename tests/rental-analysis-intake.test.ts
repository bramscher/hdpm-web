import assert from 'node:assert/strict'
import test from 'node:test'
import type { Payload } from 'payload'
import type { LeadNotification } from '../src/lib/notify'
import { createRentalAnalysisHandler } from '../src/lib/crm/rental-analysis-intake'

const submission = {
  name: 'Different Person',
  email: '  EXISTING@example.com ',
  phone: '(541) 555-0199',
  message: 'Please analyze my other property.',
  source_detail: 'Market page: Bend',
  attribution: { utmCampaign: 'new-campaign' },
  subject: {
    address: '123 New Street', town: 'Bend', zip_code: '97701',
    bedrooms: 3, bathrooms: 2, sqft: 1500, property_type: 'SFR',
    current_rent: 2200, amenities: ['garage'], lookup_sources: ['Google'],
  },
}

function request(body: unknown = submission) {
  return new Request('https://example.com/api/crm/rental-analysis', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

type Write = { collection: string; id?: number; data: Record<string, unknown> }

function setup(options: { match?: 'email' | 'phone'; failSave?: boolean; forwardResponse?: Response; configured?: boolean } = {}) {
  const existing = {
    id: 42, firstName: 'Established', lastName: 'Contact', email: 'existing@example.com',
    phone: '+15415550100', leadType: 'tenant', source: 'referral', sourceDetail: 'Original referral',
    status: 'leased', assignedTo: 3, message: 'Original inquiry', doNotContact: true,
    subjectProperty: { address: '456 Existing Street', town: 'Redmond' },
    attribution: { utmCampaign: 'original-campaign' },
    rentAnalysisId: 'existing-analysis', rentAnalysisStatus: 'delivered',
    rentAnalysisShortUrl: 'https://example.com/existing-report',
  }
  const before = structuredClone(existing)
  const writes: Write[] = []
  const notifications: LeadNotification[] = []
  const lookups: Record<string, unknown>[] = []
  const forwards: Array<{ url: string; body: Record<string, unknown>; options?: RequestInit }> = []
  let payloadCalls = 0
  const payload = {
    find: async ({ where }: { where: Record<string, unknown> }) => {
      lookups.push(where)
      return { docs: options.match && where[options.match] ? [existing] : [] }
    },
    create: async (write: Write) => {
      if (options.failSave) throw new Error('save failed')
      writes.push(structuredClone(write))
      return { id: 99, ...write.data }
    },
    update: async (write: Write) => {
      writes.push(structuredClone(write))
      if (write.id === existing.id) Object.assign(existing, write.data)
      return { id: write.id, ...write.data }
    },
  } as unknown as Payload
  const handler = createRentalAnalysisHandler({
    getPayload: async () => { payloadCalls++; return payload },
    sendLeadNotification: async (notification) => { notifications.push(notification); return true },
    fetch: async (url, init) => {
      forwards.push({ url: String(url), body: JSON.parse(String(init?.body)), options: init })
      return options.forwardResponse ?? Response.json({ id: 'new-analysis' })
    },
    chatbotBaseUrl: options.configured === false ? '' : 'https://chatbot.example.com',
    serviceToken: 'test-service-token',
  })
  return { handler, existing, before, writes, notifications, lookups, forwards, payloadCalls: () => payloadCalls }
}

for (const match of ['email', 'phone'] as const) {
  test(`${match} matches preserve the whole lead and record a reviewable request without a chatbot handoff`, async () => {
    const app = setup({ match })
    const response = await app.handler(request())
    assert.equal(response.status, 200)
    assert.deepEqual(await response.json(), { ok: true })
    assert.deepEqual(app.existing, app.before)
    assert.equal(app.forwards.length, 0)
    assert.equal(app.writes.length, 1)
    const activity = app.writes[0]
    assert.equal(activity.collection, 'lead-activities')
    assert.equal(activity.data.lead, 42)
    assert.equal(activity.data.direction, 'inbound')
    assert.match(String(activity.data.body), /staff review required/)
    assert.deepEqual(activity.data.metadata, {
      kind: 'rental_analysis_request', reviewStatus: 'pending', contactVerified: false,
      contact: { firstName: 'Different', lastName: 'Person', email: 'existing@example.com', phone: '+15415550199' },
      subjectProperty: {
        address: '123 New Street', town: 'Bend', zipCode: '97701', bedrooms: 3, bathrooms: 2,
        sqft: 1500, propertyType: 'SFR', currentRent: 2200, amenities: ['garage'], lookupSources: ['Google'],
      },
      message: submission.message, source: 'website', sourceDetail: submission.source_detail,
      attribution: submission.attribution,
    })
    assert.equal(app.notifications.length, 1)
    assert.match(app.notifications[0].warning!, /REVIEW REQUIRED/)
    assert.match(app.notifications[0].warning!, /established contact details/)
    assert.deepEqual(app.lookups[0], { email: { equals: 'existing@example.com' } })
    if (match === 'phone') assert.deepEqual(app.lookups[1], { phone: { equals: '+15415550199' } })
  })
}

test('repeated property requests append separate activities instead of replacing previous submissions', async () => {
  const app = setup({ match: 'email' })
  await app.handler(request())
  await app.handler(request({ ...submission, subject: { address: 'Another Property' } }))
  assert.equal(app.writes.length, 2)
  assert.match(String(app.writes[0].data.body), /123 New Street/)
  assert.match(String(app.writes[1].data.body), /Another Property/)
  assert.deepEqual(app.existing, app.before)
  assert.equal(app.forwards.length, 0)
})

test('new contacts still create owner leads, forward the submitted property, and store the analysis ID', async () => {
  const app = setup()
  const response = await app.handler(request({ ...submission, name: 'Cher' }))
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { ok: true })
  assert.equal(app.writes[0].collection, 'leads')
  assert.equal(app.writes[0].data.leadType, 'owner')
  assert.equal(app.writes[0].data.firstName, 'Cher')
  assert.equal(app.writes[0].data.lastName, '—')
  assert.equal(app.writes[0].data.rentAnalysisStatus, 'requested')
  assert.deepEqual(app.writes[0].data.attribution, submission.attribution)
  assert.equal(app.forwards.length, 1)
  assert.equal(app.forwards[0].url, 'https://chatbot.example.com/api/intake/rental-analysis-request')
  assert.equal(app.forwards[0].body.lead_id, 99)
  assert.ok(app.forwards[0].options?.signal)
  assert.deepEqual(app.writes[1], { collection: 'leads', id: 99, data: { rentAnalysisId: 'new-analysis' } })
  assert.equal(app.notifications[0].warning, undefined)
})

test('an unconfigured handoff does not turn a repeat request into a failure or overwrite an analysis', async () => {
  const app = setup({ match: 'email', configured: false })
  assert.equal((await app.handler(request())).status, 200)
  assert.match(app.notifications[0].warning!, /REVIEW REQUIRED/)
  assert.doesNotMatch(app.notifications[0].warning!, /FAILED/)
  assert.deepEqual(app.existing, app.before)
})

test('handoff failures notify staff but do not disclose internal errors to the public', async (t) => {
  t.mock.method(console, 'error', () => {})
  const app = setup({ forwardResponse: new Response('private upstream details', { status: 503 }) })
  const response = await app.handler(request())
  assert.deepEqual(await response.json(), { ok: true })
  assert.match(app.notifications[0].warning!, /Handoff.*FAILED/)
  assert.equal(app.writes.length, 1)
})

test('failed activity persistence returns an error without forwarding or sending a misleading notification', async (t) => {
  t.mock.method(console, 'error', () => {})
  const app = setup({ match: 'email', failSave: true })
  assert.equal((await app.handler(request())).status, 500)
  assert.equal(app.notifications.length, 0)
  assert.equal(app.forwards.length, 0)
  assert.deepEqual(app.existing, app.before)
})

test('invalid submissions return 400 before touching the database', async () => {
  const app = setup()
  for (const body of [
    null, [], {}, { ...submission, phone: 5415550199 }, { ...submission, email: {} },
    { ...submission, name: '   ' }, { ...submission, email: 'not-an-email' },
    { ...submission, phone: 'letters' }, { ...submission, subject: { address: '   ' } },
    { ...submission, subject: { address: 'Street', amenities: 'garage' } },
    { ...submission, subject: { address: 'Street', bedrooms: -1 } },
    { ...submission, subject: { address: 'Street', town: 'Unsupported town' } },
    { ...submission, attribution: { utmCampaign: { nested: 'invalid' } } },
  ]) assert.equal((await app.handler(request(body))).status, 400)
  assert.equal(app.payloadCalls(), 0)
  const invalidJson = new Request('https://example.com', { method: 'POST', body: '{' })
  assert.equal((await app.handler(invalidJson)).status, 400)
})

test('honeypots return the same acknowledgment without any side effects', async () => {
  const app = setup()
  assert.deepEqual(await (await app.handler(request({ hp: 'bot' }))).json(), { ok: true })
  assert.equal(app.payloadCalls(), 0)
  assert.equal(app.notifications.length, 0)
  assert.equal(app.forwards.length, 0)
})
