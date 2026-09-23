import assert from 'node:assert/strict'
import test from 'node:test'
import type { CollectionAfterChangeHook, CollectionBeforeChangeHook } from 'payload'
import { leadTasksBeforeChange } from '../src/collections/hooks/lead-tasks/beforeChange'
import { leadTasksAfterChange } from '../src/collections/hooks/lead-tasks/afterChange'
import { leadsAfterChange } from '../src/collections/hooks/leads/afterChange'

test('task completion is stamped in the original write, with existing timestamps preserved', async () => {
  const invoke = (data: object, originalDoc: object, operation = 'update') => leadTasksBeforeChange({
    data, originalDoc, operation,
  } as Parameters<CollectionBeforeChangeHook>[0])
  const result = await invoke({ status: 'complete' }, { status: 'open' })
  assert.ok(Number.isFinite(Date.parse(result.completedAt)))
  const timestamp = '2026-09-01T12:00:00.000Z'
  assert.equal((await invoke({ status: 'complete', completedAt: timestamp }, { status: 'open' })).completedAt, timestamp)
  assert.equal((await invoke({ status: 'complete' }, { status: 'complete' })).completedAt, undefined)
  assert.equal((await invoke({ status: 'open' }, { status: 'open' })).completedAt, undefined)
})

test('completing a task emits one activity in the same transaction without a recursive task update', async () => {
  const writes: Array<Record<string, unknown>> = []
  const req = {
    transactionID: 'task-transaction', user: { id: 2 },
    payload: {
      create: async (options: Record<string, unknown>) => { writes.push(options) },
      update: async () => { assert.fail('Task completion must not update its own row from afterChange') },
    },
  }
  await leadTasksAfterChange({
    operation: 'update', previousDoc: { status: 'open' },
    doc: { id: 4, lead: 1, status: 'complete', title: 'Call owner' }, req,
  } as unknown as Parameters<CollectionAfterChangeHook>[0])
  assert.equal(writes.length, 1)
  assert.equal(writes[0].req, req)
  assert.equal(writes[0].collection, 'lead-activities')
  assert.equal((writes[0].data as Record<string, unknown>).type, 'task_completed')
})

test('lead creation awaits activity and follow-up writes, including nested task activity, in one transaction', async () => {
  const writes: Array<Record<string, unknown>> = []
  const req = {
    transactionID: 'lead-transaction', user: { id: 2 },
    payload: {
      create: async (options: Record<string, unknown>) => {
        assert.equal(options.req, req)
        // A microtask boundary ensures the hook awaits each dependent write.
        await Promise.resolve()
        writes.push(options)
        if (options.collection === 'lead-tasks') {
          await leadTasksAfterChange({
            operation: 'create', doc: { id: 10, ...(options.data as object) }, req,
          } as unknown as Parameters<CollectionAfterChangeHook>[0])
        }
      },
    },
  }
  await leadsAfterChange({
    operation: 'create', doc: { id: 1, firstName: 'Test', lastName: 'Owner', assignedTo: { id: 2 }, source: 'website' }, req,
  } as unknown as Parameters<CollectionAfterChangeHook>[0])
  assert.deepEqual(writes.map((write) => write.collection), ['lead-activities', 'lead-tasks', 'lead-activities'])
  assert.equal((writes[1].data as Record<string, unknown>).assignedTo, 2)
})

test('failed dependent writes reject the lead save so Payload can roll back', async () => {
  const req = { payload: { create: async () => { throw new Error('database unavailable') } } }
  await assert.rejects(leadsAfterChange({
    operation: 'create', doc: { id: 1, source: 'website' }, req,
  } as unknown as Parameters<CollectionAfterChangeHook>[0]), /database unavailable/)
})

test('unassigned leads do not create invalid tasks and ordinary edits do not add status activities', async () => {
  const writes: unknown[] = []
  const req = { payload: { create: async (options: unknown) => { writes.push(options) } } }
  await leadsAfterChange({ operation: 'create', doc: { id: 1 }, req } as unknown as Parameters<CollectionAfterChangeHook>[0])
  assert.equal(writes.length, 1)
  await leadsAfterChange({
    operation: 'update', doc: { id: 1, status: 'new' }, previousDoc: { status: 'new' }, req,
  } as unknown as Parameters<CollectionAfterChangeHook>[0])
  assert.equal(writes.length, 1)
})
