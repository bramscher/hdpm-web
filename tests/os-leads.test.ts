import assert from 'node:assert/strict'
import test from 'node:test'
import { allowedNextStatuses, leadSummary, userSummary } from '../src/lib/os-leads'

test('lead summaries name the lead and its owner without exposing extra fields', () => {
  const summary = leadSummary({
    id: 5,
    firstName: 'Ana',
    lastName: 'Diaz',
    email: 'ana@example.com',
    status: 'engaged',
    assignedTo: { id: 2, firstName: 'Lisa', lastName: '', email: 'lisa@highdesertpm.com' },
    message: 'private inquiry text',
    createdAt: '2026-10-01T00:00:00.000Z',
  } as any)
  assert.equal(summary.name, 'Ana Diaz')
  assert.deepEqual(summary.assignedTo, { id: 2, name: 'Lisa' })
  assert.equal('message' in summary, false)
  assert.equal(userSummary(7 as any), null)
})

test('status choices follow the CRM pipeline', () => {
  assert.ok(allowedNextStatuses('new').includes('attempted_contact'))
  assert.equal(allowedNextStatuses('new').includes('leased'), false)
  assert.ok(allowedNextStatuses(undefined).includes('engaged'))
})

test('board leads carry card fields, the current-status time and their allowed moves', async () => {
  const { boardLead } = await import('../src/lib/os-leads')
  const lead = boardLead({
    id: 9,
    firstName: 'Test',
    lastName: 'Owner',
    email: 'owner@example.com',
    status: 'engaged',
    leadType: 'owner',
    source: 'referral',
    sourceDetail: 'Partner brokerage',
    expectedDoors: 4,
    subjectProperty: { address: '100 Example St', town: 'Bend' },
    statusEnteredAt: '2026-10-20T00:00:00.000Z',
    createdAt: '2026-10-01T00:00:00.000Z',
  } as any)
  assert.equal(lead.expectedDoors, 4)
  assert.equal(lead.town, 'Bend')
  assert.equal(lead.propertyAddress, '100 Example St')
  assert.equal(lead.sourceDetail, 'Partner brokerage')
  assert.equal(lead.statusEnteredAt, '2026-10-20T00:00:00.000Z')
  assert.ok(lead.allowedStatuses.includes('proposal_sent'))
  assert.equal(lead.allowedStatuses.includes('tour_scheduled'), false)
  assert.equal('message' in lead, false)

  const bare = boardLead({ id: 10, email: 'x@example.com', leadType: 'owner', createdAt: '2026-10-01T00:00:00.000Z' } as any)
  assert.equal(bare.expectedDoors, null)
  assert.equal(bare.town, null)
  assert.equal(bare.propertyAddress, null)
  assert.equal(bare.statusEnteredAt, '2026-10-01T00:00:00.000Z')
})

test('expected doors accept whole numbers of 0 or more, or null to clear', async () => {
  const { parseExpectedDoors } = await import('../src/lib/os-leads')
  assert.deepEqual(parseExpectedDoors(3), { ok: true, value: 3 })
  assert.deepEqual(parseExpectedDoors(0), { ok: true, value: 0 })
  assert.deepEqual(parseExpectedDoors('12'), { ok: true, value: 12 })
  assert.deepEqual(parseExpectedDoors(null), { ok: true, value: null })
  assert.deepEqual(parseExpectedDoors(''), { ok: true, value: null })
  for (const bad of [-1, 2.5, 'two', true, {}, Number.NaN])
    assert.equal(parseExpectedDoors(bad).ok, false, `rejects ${String(bad)}`)
})

test('the board covers the owner pipeline columns and leaves archived leads out', async () => {
  const { BOARD_STATUSES } = await import('../src/lib/os-leads')
  assert.deepEqual([...BOARD_STATUSES], [
    'new', 'attempted_contact', 'engaged', 'consult_booked', 'proposal_sent', 'signed', 'lost',
  ])
})
