import type { Payload, Where } from 'payload'
import type { Job } from '@/payload-types'
import { ensureJobsImageColumn, executeSql, rowsOf } from './ensure-jobs-image-column'

const openJobsWhere: Where = { status: { equals: 'open' } }

export function isMissingJobsImageColumn(error: unknown): boolean {
  const seen = new Set<unknown>()
  const messages: string[] = []
  let sawUndefinedColumn = false
  let current: unknown = error
  for (let depth = 0; depth < 6 && current && !seen.has(current); depth += 1) {
    seen.add(current)
    if (typeof current !== 'object') break
    const record = current as { code?: unknown; message?: unknown; cause?: unknown }
    if (record.code === '42703') sawUndefinedColumn = true
    if (typeof record.message === 'string') messages.push(record.message)
    current = record.cause
  }
  const text = messages.join('\n')
  return /image_id/i.test(text) && (sawUndefinedColumn || /does not exist/i.test(text))
}

function iso(value: unknown): string {
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string' && value) return value
  return new Date(0).toISOString()
}

function mapJobRow(row: Record<string, unknown>): Job {
  return {
    id: Number(row.id),
    title: String(row.title ?? ''),
    slug: String(row.slug ?? ''),
    status: row.status as Job['status'],
    order: row.order == null || row.order === '' ? null : Number(row.order),
    summary: String(row.summary ?? ''),
    description: (row.description ?? null) as Job['description'],
    location: (row.location ?? null) as string | null,
    schedule: (row.schedule ?? null) as string | null,
    compensation: (row.compensation ?? null) as string | null,
    contactEmail: (row.contactEmail ?? row.contact_email ?? null) as string | null,
    updatedAt: iso(row.updatedAt ?? row.updated_at),
    createdAt: iso(row.createdAt ?? row.created_at),
  }
}

async function readOpenJobsWithoutImage(payload: Payload, whereId?: number): Promise<Job[]> {
  const execute = executeSql(payload)
  if (!execute) throw new Error('Database is unavailable')
  if (whereId !== undefined && !Number.isInteger(whereId)) return []
  const idClause = whereId === undefined ? '' : ` AND "id" = ${whereId}`
  const jobs = rowsOf(
    await execute(`SELECT "id", "title", "slug", "status", "order", "summary", "description",
        "location", "schedule", "compensation", "contact_email" AS "contactEmail",
        "updated_at" AS "updatedAt", "created_at" AS "createdAt"
      FROM "payload_web"."jobs"
      WHERE "status" = 'open'${idClause}
      ORDER BY "order" ASC, "title" ASC`),
  ).map((row) => mapJobRow(row as Record<string, unknown>))

  const ids = jobs.map((job) => job.id).filter((id) => Number.isInteger(id))
  if (!ids.length) return jobs
  try {
    const links = rowsOf(
      await execute(`SELECT "_parent_id" AS "parentId", "id", "label", "url"
        FROM "payload_web"."jobs_posting_links"
        WHERE "_parent_id" IN (${ids.join(', ')})
        ORDER BY "_order" ASC`),
    )
    const byParent = new Map<number, NonNullable<Job['postingLinks']>>()
    for (const link of links) {
      const row = link as Record<string, unknown>
      const parentId = Number(row.parentId)
      const list = byParent.get(parentId) ?? []
      list.push({
        id: row.id == null ? null : String(row.id),
        label: String(row.label ?? ''),
        url: String(row.url ?? ''),
      })
      byParent.set(parentId, list)
    }
    return jobs.map((job) => ({ ...job, postingLinks: byParent.get(job.id) ?? [] }))
  } catch {
    return jobs
  }
}

async function findJobs(
  payload: Payload,
  where: Where,
  depth: 0 | 1,
  omitImage: boolean,
): Promise<Job[]> {
  const { docs } = await payload.find({
    collection: 'jobs',
    overrideAccess: false,
    where,
    sort: ['order', 'title'],
    pagination: false,
    depth,
    ...(omitImage ? { select: { image: false } } : {}),
  })
  return docs
}

export async function findOpenJobs(payload: Payload): Promise<Job[]> {
  await ensureJobsImageColumn(payload)
  try {
    return await findJobs(payload, openJobsWhere, 1, false)
  } catch (error) {
    if (!isMissingJobsImageColumn(error)) throw error
    payload.logger.warn('jobs.image_id is missing; /careers is using static role photos.')
    try {
      return await findJobs(payload, openJobsWhere, 0, true)
    } catch (fallbackError) {
      if (!isMissingJobsImageColumn(fallbackError)) throw fallbackError
      return readOpenJobsWithoutImage(payload)
    }
  }
}

export async function findOpenJobById(payload: Payload, jobId: number): Promise<Job | null> {
  if (!Number.isInteger(jobId)) return null
  await ensureJobsImageColumn(payload)
  const where: Where = { and: [{ id: { equals: jobId } }, openJobsWhere] }
  try {
    const docs = await findJobs(payload, where, 0, true)
    return docs[0] ?? null
  } catch (error) {
    if (!isMissingJobsImageColumn(error)) throw error
    const docs = await readOpenJobsWithoutImage(payload, jobId)
    return docs[0] ?? null
  }
}
