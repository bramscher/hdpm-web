import assert from 'node:assert/strict'
import test from 'node:test'
import type { Payload } from 'payload'
import {
  JOBS_IMAGE_MIGRATION_NAME,
  jobsImageDownStatements,
  jobsImageUpStatements,
  up,
} from '../src/migrations/20260926_203100_add_jobs_image'
import {
  applyJobsImageColumn,
  jobsImageRecordStatement,
  rowsOf,
} from '../src/lib/ensure-jobs-image-column'
import { findOpenJobById, findOpenJobs, isMissingJobsImageColumn } from '../src/lib/open-jobs'

test('jobs image migration can run again without recreating data', () => {
  const upSql = jobsImageUpStatements.join('\n')
  assert.match(upSql, /ADD COLUMN IF NOT EXISTS "image_id"/)
  assert.match(upSql, /WHEN duplicate_object THEN NULL/)
  assert.match(upSql, /CREATE INDEX IF NOT EXISTS "jobs_image_idx"/)
  assert.doesNotMatch(upSql, /INSERT INTO "payload_web"\."jobs"/)
  assert.doesNotMatch(upSql, /DROP TABLE/)
  const downSql = jobsImageDownStatements.join('\n')
  assert.match(downSql, /DROP CONSTRAINT IF EXISTS/)
  assert.match(downSql, /DROP COLUMN IF EXISTS "image_id"/)
  assert.equal(JOBS_IMAGE_MIGRATION_NAME, '20260926_203100_add_jobs_image')
  assert.match(jobsImageRecordStatement, new RegExp(JOBS_IMAGE_MIGRATION_NAME))
})

test('migration up executes one statement at a time', async () => {
  const calls: unknown[] = []
  await up({
    db: {
      execute: async (query: unknown) => {
        calls.push(query)
      },
    },
  } as unknown as Parameters<typeof up>[0])
  assert.equal(calls.length, jobsImageUpStatements.length)
})

test('column check treats pg and drizzle results as row lists', () => {
  assert.equal(rowsOf([{ ok: 1 }]).length, 1)
  assert.equal(rowsOf({ rows: [{ ok: 1 }] }).length, 1)
  assert.equal(rowsOf({ rows: [] }).length, 0)
  assert.equal(rowsOf(undefined).length, 0)
})

test('skips DDL when jobs.image_id and the migration row already exist', async () => {
  const ran: string[] = []
  const status = await applyJobsImageColumn(async (statement) => {
    ran.push(statement)
    if (statement.includes('information_schema.columns')) return { rows: [{ ok: 1 }] }
    if (statement.includes('payload_migrations')) return { rows: [{ ok: 1 }] }
    return { rows: [] }
  })
  assert.equal(status, 'ready')
  assert.equal(ran.some((statement) => statement.includes('ALTER TABLE')), false)
})

test('applies idempotent DDL and records the migration when the column is missing', async () => {
  const ran: string[] = []
  const status = await applyJobsImageColumn(async (statement) => {
    ran.push(statement)
    return { rows: [] }
  })
  assert.equal(status, 'applied')
  const sql = ran.join('\n')
  assert.match(sql, /ADD COLUMN IF NOT EXISTS "image_id"/)
  assert.match(sql, /duplicate_object/)
  assert.match(sql, /CREATE INDEX IF NOT EXISTS "jobs_image_idx"/)
  assert.match(sql, /INSERT INTO "payload_web"\."payload_migrations"/)
})

test('recognizes a missing jobs.image_id column through wrapped driver errors', () => {
  const cause = Object.assign(new Error('column "image_id" of relation "jobs" does not exist'), {
    code: '42703',
  })
  const wrapped = new Error('Failed query: select "jobs"."image_id" from "payload_web"."jobs"')
  ;(wrapped as Error & { cause?: unknown }).cause = cause
  assert.equal(isMissingJobsImageColumn(wrapped), true)
  assert.equal(isMissingJobsImageColumn(new Error('connect ECONNREFUSED')), false)
  assert.equal(isMissingJobsImageColumn(Object.assign(new Error('permission denied'), { code: '42703' })), false)
})

test('careers falls back to static photos when the image column is missing', async () => {
  const calls: Array<{ depth?: number; select?: { image?: boolean } }> = []
  const missing = Object.assign(new Error('column "image_id" does not exist'), { code: '42703' })
  const payload = {
    logger: { warn() {}, error() {} },
    db: {
      drizzle: {
        async execute() {
          throw new Error('catalog unavailable')
        },
      },
    },
    async find(args: { depth?: number; select?: { image?: boolean } }) {
      calls.push(args)
      if (calls.length === 1) throw missing
      return {
        docs: [{ id: 3, title: 'Office Assistant', slug: 'office-assistant', summary: 'Help the office.' }],
      }
    },
  }
  const jobs = await findOpenJobs(payload as unknown as Payload)
  assert.equal(jobs[0]?.slug, 'office-assistant')
  assert.equal(calls[0]?.depth, 1)
  assert.equal(calls[0]?.select, undefined)
  assert.equal(calls[1]?.depth, 0)
  assert.equal(calls[1]?.select?.image, false)
})

test('application lookup ignores a non-integer job id', async () => {
  let queries = 0
  const payload = {
    logger: { warn() {}, error() {} },
    db: { drizzle: { async execute() { queries += 1; return { rows: [] } } } },
    async find() { queries += 1; return { docs: [] } },
  }
  const job = await findOpenJobById(payload as unknown as Payload, Number.NaN)
  assert.equal(job, null)
  assert.equal(queries, 0)
})

test('application lookup does not require the image column', async () => {
  const payload = {
    logger: { warn() {}, error() {} },
    db: { drizzle: { async execute() { return { rows: [] } } } },
    async find() {
      return { docs: [{ id: 9, title: 'Maintenance Technician', slug: 'maintenance-technician' }] }
    },
  }
  const job = await findOpenJobById(payload as unknown as Payload, 9)
  assert.equal(job?.title, 'Maintenance Technician')
})

test('application lookup reads jobs directly when every ORM query selects image_id', async () => {
  const missing = Object.assign(new Error('column jobs.image_id does not exist'), { code: '42703' })
  const statements: string[] = []
  const payload = {
    logger: { warn() {}, error() {} },
    db: {
      drizzle: {
        async execute(query: { queryChunks?: Array<{ value?: string[] }> }) {
          const statement = (query.queryChunks ?? []).map((chunk) => chunk.value?.join('') ?? '').join('')
          statements.push(statement)
          if (statement.includes('information_schema') || statement.includes('payload_migrations')) {
            throw new Error('catalog unavailable')
          }
          if (statement.includes('jobs_posting_links')) {
            return { rows: [{ parentId: 4, id: 'link-1', label: 'Indeed', url: 'https://example.com/job' }] }
          }
          return {
            rows: [{
              id: 4,
              title: 'Landscape Technician',
              slug: 'landscape-technician',
              status: 'open',
              order: 4,
              summary: 'Care for outdoor spaces.',
              description: null,
              location: 'Bend, OR',
              schedule: null,
              compensation: null,
              contactEmail: 'info@highdesertpm.com',
              updatedAt: '2026-09-27T00:00:00.000Z',
              createdAt: '2026-09-27T00:00:00.000Z',
            }],
          }
        },
      },
    },
    async find() {
      throw missing
    },
  }
  const job = await findOpenJobById(payload as unknown as Payload, 4)
  assert.equal(job?.slug, 'landscape-technician')
  assert.equal(job?.postingLinks?.[0]?.label, 'Indeed')
  assert.match(statements.join('\n'), /"status" = 'open' AND "id" = 4/)
  assert.doesNotMatch(statements.join('\n'), /image_id/)
})
