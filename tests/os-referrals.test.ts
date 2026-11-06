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

type Row = Record<string, any>

/**
 * A small in-memory Payload: leads and lead-activities, with the where clauses
 * upsertReferralLead uses, unique referral ids, and a transaction that rolls
 * back every write when its work throws.
 */
function fakeStore(seed: { leads?: Row[]; activities?: Row[] } = {}) {
  const db = { leads: [...(seed.leads ?? [])], 'lead-activities': [...(seed.activities ?? [])] } as Record<string, Row[]>
  const calls: Array<{ op: string; options: Row }> = []
  let failNextNote = false
  let nextId = 100
  const matches = (row: Row, where: Row): boolean => {
    if (where.and) return where.and.every((w: Row) => matches(row, w))
    if (where.or) return where.or.some((w: Row) => matches(row, w))
    return Object.entries(where).every(([key, cond]) => row[key] != null && row[key] === (cond as Row).equals)
  }
  const unique = (collection: string, row: Row) => {
    if (row.referralLeadId && db[collection].some((r) => r.referralLeadId === row.referralLeadId))
      throw new Error('duplicate key value violates unique constraint')
  }
  const payload = {
    find: async (options: Row) => {
      calls.push({ op: 'find', options })
      const docs = db[options.collection].filter((row) => matches(row, options.where))
      if (options.sort === 'createdAt') docs.sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
      return { docs: docs.slice(0, options.limit ?? 10) }
    },
    findByID: async (options: Row) => {
      calls.push({ op: 'findByID', options })
      return db[options.collection].find((row) => row.id === options.id)
    },
    update: async (options: Row) => {
      calls.push({ op: 'update', options })
      unique(options.collection, options.data)
      const row = db[options.collection].find((r) => r.id === options.id)!
      Object.assign(row, options.data)
      return { ...row }
    },
    create: async (options: Row) => {
      calls.push({ op: 'create', options })
      if (options.collection === 'lead-activities' && failNextNote) {
        failNextNote = false
        throw new Error('Injected note write failure')
      }
      unique(options.collection, options.data)
      const row = { id: nextId++, createdAt: '2026-11-06T00:00:00.000Z', ...options.data }
      db[options.collection].push(row)
      return { ...row }
    },
  }
  const transaction = async (_payload: unknown, _user: unknown, work: (req: Row) => Promise<unknown>) => {
    const before = structuredClone(db)
    try {
      return await work({ transactionID: 'fake' })
    } catch (error) {
      for (const key of Object.keys(db)) db[key] = before[key]
      throw error
    }
  }
  return {
    payload: payload as any,
    transaction: transaction as any,
    db,
    calls,
    failNextNote: () => { failNextNote = true },
    notes: () => db['lead-activities'].filter((a) => a.referralLeadId),
  }
}

const input = (referralId = REF, extra: Record<string, unknown> = {}) => {
  const parsed = parseReferral(referralId, body(extra))
  assert.ok(parsed.ok)
  return parsed.value
}
const ownerLead = (extra: Row = {}) => ({
  id: 8, leadType: 'owner', email: 'owner@example.com', phone: null, status: 'engaged',
  source: 'website', referralLeadId: null, createdAt: '2026-10-01T00:00:00.000Z', ...extra,
})
const SECOND = '22222222-3333-4444-8555-666666666666'

test('a resent referral returns its lead and changes nothing', async () => {
  const store = fakeStore({ leads: [ownerLead({ referralLeadId: REF })] })
  const result = await upsertReferralLead(store.payload, input(), null, store.transaction)
  assert.equal(result.outcome, 'existing')
  assert.equal(result.lead.id, 8)
  assert.deepEqual(store.calls.map((c) => c.op), ['find'])
})

test('a new prospect becomes an owner lead attributed to the partner', async () => {
  const store = fakeStore({ leads: [{ id: 3, leadType: 'tenant', email: 'owner@example.com', createdAt: 'x' }] })
  const user = { id: 3 } as any
  const result = await upsertReferralLead(store.payload, input(), user, store.transaction)
  assert.equal(result.outcome, 'created')
  const create = store.calls.find((c) => c.op === 'create')!
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
  const card = boardLead(result.lead)
  assert.deepEqual(card.referralPartner, { id: PARTNER.id, name: 'Sample Agent (Example Realty)' })
  assert.equal(card.expectedDoors, 3)
})

test('organic portal referrals are website leads with no partner', async () => {
  const store = fakeStore()
  await upsertReferralLead(store.payload, input(REF, { partner: null }), null, store.transaction)
  const data = store.calls.find((c) => c.op === 'create')!.options.data
  assert.deepEqual([data.source, data.sourceDetail, data.referralPartnerId], ['website', 'Partner portal', null])
})

test('a match on an existing owner lead links it once, keeping its attribution', async () => {
  const store = fakeStore({ leads: [ownerLead()] })
  const first = await upsertReferralLead(store.payload, input(), null, store.transaction)
  assert.equal(first.outcome, 'linked')
  assert.equal(first.lead.id, 8)
  const lead = store.db.leads[0]
  assert.equal(lead.referralLeadId, REF)
  assert.deepEqual([lead.source, lead.status], ['website', 'engaged'])
  assert.equal(store.notes().length, 1)
  assert.match(store.notes()[0].body, /Sample Agent \(Example Realty\)/)
  const again = await upsertReferralLead(store.payload, input(), null, store.transaction)
  assert.equal(again.outcome, 'existing')
  assert.equal(store.notes().length, 1)
  assert.equal(store.db.leads.length, 1)
})

test('a second partner referring the same owner is linked once, then resolves without the contact match', async () => {
  const store = fakeStore({ leads: [ownerLead({ referralLeadId: REF })] })
  const outcomes = []
  for (let i = 0; i < 2; i++)
    outcomes.push((await upsertReferralLead(store.payload, input(SECOND), null, store.transaction)).outcome)
  assert.deepEqual(outcomes, ['linked', 'existing'])
  assert.equal(store.notes().length, 1)
  assert.equal(store.db.leads[0].referralLeadId, REF, 'first referral keeps the attribution')
  // The owner's contact changes; the same referral still finds its lead.
  store.db.leads[0].email = 'changed@example.com'
  const later = await upsertReferralLead(store.payload, input(SECOND), null, store.transaction)
  assert.deepEqual([later.outcome, later.lead.id], ['existing', 8])
  assert.equal(store.db.leads.length, 1)
})

test('a failed link note rolls the link back, so a retry writes the link and its note', async () => {
  const store = fakeStore({ leads: [ownerLead()] })
  store.failNextNote()
  await assert.rejects(upsertReferralLead(store.payload, input(), null, store.transaction), /Injected note write failure/)
  assert.equal(store.db.leads[0].referralLeadId, null)
  assert.equal(store.notes().length, 0)
  const retry = await upsertReferralLead(store.payload, input(), null, store.transaction)
  assert.equal(retry.outcome, 'linked')
  assert.equal(store.db.leads[0].referralLeadId, REF)
  assert.equal(store.notes().length, 1)
})
