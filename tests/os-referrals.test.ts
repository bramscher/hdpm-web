import assert from 'node:assert/strict'
import test from 'node:test'
import { parseReferral, partnerLabel, upsertReferralLead } from '../src/lib/os-referrals'
import { boardLead } from '../src/lib/os-leads'

const REF = '11111111-2222-4333-8444-555555555555'
const PARTNER = { id: '99999999-8888-4777-8666-555555555555', name: 'Sample Agent', company: 'Example Realty' }
const body = (extra: Record<string, unknown> = {}) => ({
  prospectName: 'Test Owner',
  prospectEmail: ' Owner@Example.com ',
  prospectPhone: '(541) 555-0100',
  propertyAddress: '100 Example St',
  town: null,
  unitCount: 3,
  notes: 'Two duplexes and a house',
  partner: PARTNER,
  ...extra,
})

test('a referral body becomes clean lead input', () => {
  const parsed = parseReferral(REF.toUpperCase(), body())
  assert.equal(parsed.ok, true)
  if (!parsed.ok) return
  assert.equal(parsed.value.referralId, REF)
  assert.equal(parsed.value.email, 'owner@example.com')
  assert.equal(parsed.value.phone, '+15415550100')
  assert.deepEqual([parsed.value.firstName, parsed.value.lastName], ['Test', 'Owner'])
  assert.equal(parsed.value.unitCount, 3)
  assert.equal(parsed.value.town, null)
  const single = parseReferral(REF, body({ prospectName: 'Cher', partner: null }))
  assert.ok(single.ok && single.value.lastName === '—' && single.value.partner === null)
})

test('referrals without an email are refused with a code HDPM OS can act on', () => {
  for (const prospectEmail of [null, '', '   ']) {
    const parsed = parseReferral(REF, body({ prospectEmail }))
    assert.deepEqual(parsed.ok ? null : [parsed.status, parsed.code], [422, 'email_required'])
  }
})

test('bad referral input is a 400 with a readable message', () => {
  const cases: Array<[string, unknown]> = [
    ['not-a-uuid', body()],
    [REF, null],
    [REF, body({ prospectName: '  ' })],
    [REF, body({ prospectEmail: 'not-an-email' })],
    [REF, body({ town: 'Portland' })],
    [REF, body({ unitCount: -1 })],
    [REF, body({ unitCount: 1.5 })],
    [REF, body({ partner: { id: 'x', name: 'A' } })],
    [REF, body({ partner: { id: PARTNER.id } })],
  ]
  for (const [id, input] of cases) {
    const parsed = parseReferral(id, input)
    assert.equal(parsed.ok, false, JSON.stringify(input))
    if (!parsed.ok) {
      assert.equal(parsed.status, 400)
      assert.ok(parsed.error.length > 10)
    }
  }
})

test('the partner label names the person and their firm', () => {
  assert.equal(partnerLabel(PARTNER), 'Sample Agent (Example Realty)')
  assert.equal(partnerLabel({ ...PARTNER, company: null }), 'Sample Agent')
  assert.equal(partnerLabel({ ...PARTNER, company: 'Sample Agent' }), 'Sample Agent')
})

type Call = { op: string; options: Record<string, any> }
function fakePayload(finds: Array<Array<Record<string, unknown>>>) {
  const calls: Call[] = []
  const payload = {
    find: async (options: Record<string, any>) => {
      calls.push({ op: 'find', options })
      return { docs: finds.shift() ?? [] }
    },
    findByID: async (options: Record<string, any>) => {
      calls.push({ op: 'findByID', options })
      return { id: options.id, email: 'owner@example.com', leadType: 'owner', referralLeadId: 'other', createdAt: '2026-10-01T00:00:00.000Z' }
    },
    update: async (options: Record<string, any>) => {
      calls.push({ op: 'update', options })
      return { id: options.id, email: 'owner@example.com', leadType: 'owner', ...options.data, createdAt: '2026-10-01T00:00:00.000Z' }
    },
    create: async (options: Record<string, any>) => {
      calls.push({ op: 'create', options })
      return { id: 77, ...options.data, createdAt: '2026-11-06T00:00:00.000Z' }
    },
  }
  return { payload: payload as any, calls }
}
const input = () => {
  const parsed = parseReferral(REF, body())
  assert.ok(parsed.ok)
  return parsed.value
}

test('a resent referral returns its lead and changes nothing', async () => {
  const { payload, calls } = fakePayload([[{ id: 5, referralLeadId: REF, createdAt: 'x' }]])
  const result = await upsertReferralLead(payload, input(), null)
  assert.equal(result.outcome, 'existing')
  assert.equal(result.lead.id, 5)
  assert.deepEqual(calls.map((c) => c.op), ['find'])
  assert.deepEqual(calls[0].options.where, { referralLeadId: { equals: REF } })
})

test('a new prospect becomes an owner lead attributed to the partner', async () => {
  const { payload, calls } = fakePayload([[], []])
  const user = { id: 3 } as any
  const result = await upsertReferralLead(payload, input(), user)
  assert.equal(result.outcome, 'created')
  const create = calls.find((c) => c.op === 'create')!
  assert.equal(create.options.collection, 'leads')
  assert.equal(create.options.user, user)
  const data = create.options.data
  assert.equal(data.leadType, 'owner')
  assert.equal(data.status, 'new')
  assert.equal(data.source, 'referral')
  assert.equal(data.sourceDetail, 'Sample Agent (Example Realty)')
  assert.equal(data.referralLeadId, REF)
  assert.equal(data.referralPartnerId, PARTNER.id)
  assert.equal(data.expectedDoors, 3)
  assert.equal(data.subjectProperty.address, '100 Example St')
  // The contact match only looks at owner leads.
  const where = calls[1].options.where
  assert.deepEqual(where.and[0], { leadType: { equals: 'owner' } })
  assert.deepEqual(where.and[1].or, [{ email: { equals: 'owner@example.com' } }, { phone: { equals: '+15415550100' } }])
  const card = boardLead(result.lead)
  assert.deepEqual(card.referralPartner, { id: PARTNER.id, name: 'Sample Agent (Example Realty)' })
  assert.equal(card.expectedDoors, 3)
})

test('organic portal referrals are website leads with no partner', async () => {
  const parsed = parseReferral(REF, body({ partner: null }))
  assert.ok(parsed.ok)
  const { payload, calls } = fakePayload([[], []])
  await upsertReferralLead(payload, parsed.value, null)
  const data = calls.find((c) => c.op === 'create')!.options.data
  assert.deepEqual([data.source, data.sourceDetail, data.referralPartnerId], ['website', 'Partner portal', null])
})

test('a match on an existing owner lead links it without touching its attribution', async () => {
  const { payload, calls } = fakePayload([[], [{ id: 8, leadType: 'owner', referralLeadId: null }]])
  const result = await upsertReferralLead(payload, input(), null)
  assert.equal(result.outcome, 'linked')
  assert.equal(result.lead.id, 8)
  const update = calls.find((c) => c.op === 'update')!
  assert.deepEqual(update.options.data, { referralLeadId: REF })
  const note = calls.find((c) => c.op === 'create')!
  assert.equal(note.options.collection, 'lead-activities')
  assert.equal(note.options.data.lead, 8)
  assert.match(note.options.data.body, /Sample Agent \(Example Realty\)/)
  assert.equal(calls.some((c) => c.op === 'create' && c.options.collection === 'leads'), false)
})

test('a second partner referring the same owner links with a note only', async () => {
  const { payload, calls } = fakePayload([[], [{ id: 8, leadType: 'owner', referralLeadId: 'first-referral' }]])
  const result = await upsertReferralLead(payload, input(), null)
  assert.equal(result.outcome, 'linked')
  assert.equal(calls.some((c) => c.op === 'update'), false)
  assert.deepEqual(calls.filter((c) => c.op === 'create').map((c) => c.options.collection), ['lead-activities'])
})
