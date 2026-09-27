import { type MigrateUpArgs, sql } from '@payloadcms/db-postgres'
import { rewriteJobApplyInstructions } from '../lib/job-apply-instructions'

/**
 * Point stored job descriptions at the careers application form.
 *
 * Several open roles told candidates to email a résumé to info@highdesertpm.com.
 * Accounting Bookkeeper already mentioned the form, without a link. This stores
 * the same sentence the public page renders: fill out the application form at
 * /careers#application and select the role. Other description text, including
 * the equal-opportunity line, is left in place.
 *
 * Down does not restore the email instructions.
 */

function resultRows(result: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(result)) return result as Array<Record<string, unknown>>
  if (result && typeof result === 'object' && Array.isArray((result as { rows?: unknown }).rows)) {
    return (result as { rows: Array<Record<string, unknown>> }).rows
  }
  return []
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  const result = await db.execute(sql`
    SELECT "id", "title", "description" FROM "payload_web"."jobs"
  `)
  for (const row of resultRows(result)) {
    const next = rewriteJobApplyInstructions(row.description, String(row.title ?? ''))
    if (next === row.description) continue
    await db.execute(sql`
      UPDATE "payload_web"."jobs"
      SET "description" = CAST(${JSON.stringify(next)} AS jsonb),
          "updated_at" = now()
      WHERE "id" = ${row.id}
    `)
  }
}

export async function down(): Promise<void> {
  // The previous How to apply copy asked candidates to email a résumé.
  // Rolling this migration back leaves the form instructions in place.
}
