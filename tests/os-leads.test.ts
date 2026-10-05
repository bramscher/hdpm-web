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
