import assert from 'node:assert/strict'
import test from 'node:test'
import { isValidTransition } from '../src/lib/crm/pipeline'
import { LeadStatus, nextStatuses } from '../src/lib/crm/types'

test('owner leads move consult → proposal → signed; renter stages are not offered', () => {
  assert.ok(isValidTransition(LeadStatus.New, LeadStatus.ConsultBooked, 'owner'))
  assert.ok(isValidTransition(LeadStatus.ConsultBooked, LeadStatus.ProposalSent, 'owner'))
  assert.ok(isValidTransition(LeadStatus.ProposalSent, LeadStatus.Signed, 'owner'))
  assert.ok(!isValidTransition(LeadStatus.Engaged, LeadStatus.TourScheduled, 'owner'))
  assert.ok(!nextStatuses(LeadStatus.New, 'owner').includes(LeadStatus.Leased))
})

test('tenant and untyped leads keep the renter pipeline and cannot be signed', () => {
  assert.ok(isValidTransition(LeadStatus.Engaged, LeadStatus.TourScheduled, 'tenant'))
  assert.ok(isValidTransition(LeadStatus.Engaged, LeadStatus.TourScheduled))
  assert.ok(!isValidTransition(LeadStatus.New, LeadStatus.ConsultBooked, 'tenant'))
  assert.ok(!isValidTransition(LeadStatus.ProposalSent, LeadStatus.Signed, null))
})
