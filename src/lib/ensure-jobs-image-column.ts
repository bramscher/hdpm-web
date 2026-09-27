import { sql } from '@payloadcms/db-postgres'
import type { Payload } from 'payload'
import {
  JOBS_IMAGE_MIGRATION_NAME,
  jobsImageUpStatements,
} from '../migrations/20260926_203100_add_jobs_image'

export type SqlExecutor = (statement: string) => Promise<unknown>

export type JobsImageColumnStatus = 'ready' | 'applied'

const columnExistsSql = `SELECT 1 AS "ok"
  FROM information_schema.columns
  WHERE table_schema = 'payload_web'
    AND table_name = 'jobs'
    AND column_name = 'image_id'
  LIMIT 1`

const migrationRecordedSql = `SELECT 1 AS "ok"
  FROM "payload_web"."payload_migrations"
  WHERE "name" = '${JOBS_IMAGE_MIGRATION_NAME}'
  LIMIT 1`

export const jobsImageRecordStatement = `INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
  SELECT '${JOBS_IMAGE_MIGRATION_NAME}',
         COALESCE((SELECT MAX("batch") FROM "payload_web"."payload_migrations"), 0) + 1,
         now(),
         now()
  WHERE NOT EXISTS (
    SELECT 1 FROM "payload_web"."payload_migrations" WHERE "name" = '${JOBS_IMAGE_MIGRATION_NAME}'
  )`

export function rowsOf(result: unknown): unknown[] {
  if (Array.isArray(result)) return result
  if (result && typeof result === 'object' && 'rows' in result) {
    const rows = (result as { rows?: unknown }).rows
    if (Array.isArray(rows)) return rows
  }
  return []
}

/**
 * Add jobs.image_id when it is missing, then record the migration name so
 * `payload migrate` will not run it again. When both are already present this
 * only reads the catalog — it does not take an ALTER TABLE lock.
 */
export async function applyJobsImageColumn(execute: SqlExecutor): Promise<JobsImageColumnStatus> {
  const columnExists = rowsOf(await execute(columnExistsSql)).length > 0
  let migrationRecorded = false
  try {
    migrationRecorded = rowsOf(await execute(migrationRecordedSql)).length > 0
  } catch {
    migrationRecorded = false
  }
  if (columnExists && migrationRecorded) return 'ready'

  for (const statement of jobsImageUpStatements) {
    await execute(statement)
  }
  try {
    await execute(jobsImageRecordStatement)
  } catch {
    // The column is usable even if bookkeeping fails. The next boot retries the insert.
  }
  return 'applied'
}

type DrizzleDb = { execute: (query: unknown) => Promise<unknown> }

export function executeSql(payload: Payload): SqlExecutor | null {
  const drizzle = (payload.db as { drizzle?: DrizzleDb }).drizzle
  if (!drizzle?.execute) return null
  return (statement) => drizzle.execute(sql.raw(statement))
}

let ready = false
let inflight: Promise<boolean> | null = null

export function ensureJobsImageColumn(payload: Payload): Promise<boolean> {
  if (ready) return Promise.resolve(true)
  if (!inflight) {
    inflight = (async () => {
      const execute = executeSql(payload)
      if (!execute) return false
      try {
        await applyJobsImageColumn(execute)
        ready = true
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown database error'
        payload.logger.error(
          `Could not add jobs.image_id (${message.replace(/postgres(?:ql)?:\/\/\S+/gi, 'postgresql://***')}). /careers will keep static photos until the column exists.`,
        )
        return false
      } finally {
        inflight = null
      }
    })()
  }
  return inflight
}
