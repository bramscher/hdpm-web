import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Optional role photo on Jobs.
 *
 * Adds a nullable `image_id` foreign key to the existing Media collection,
 * matching other upload fields (for example team member photos). Existing job
 * rows are left unchanged — the column stays null until an editor attaches a
 * photo in Payload admin. This migration does not upload or seed images.
 *
 * Statements are idempotent. Production applies them from server init and from
 * `npm run db:ensure-jobs-image` before `next build`, because this Vercel app
 * does not run `payload migrate` on deploy. `npm run payload migrate` still
 * runs this file and then records it in `payload_migrations`.
 */
export const JOBS_IMAGE_MIGRATION_NAME = '20260926_203100_add_jobs_image'

export const jobsImageUpStatements = [
  'ALTER TABLE "payload_web"."jobs" ADD COLUMN IF NOT EXISTS "image_id" integer',
  `DO $$ BEGIN
    ALTER TABLE "payload_web"."jobs"
      ADD CONSTRAINT "jobs_image_id_media_id_fk"
      FOREIGN KEY ("image_id") REFERENCES "payload_web"."media"("id")
      ON DELETE SET NULL ON UPDATE NO ACTION;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END $$`,
  'CREATE INDEX IF NOT EXISTS "jobs_image_idx" ON "payload_web"."jobs" USING btree ("image_id")',
] as const

export const jobsImageDownStatements = [
  'ALTER TABLE "payload_web"."jobs" DROP CONSTRAINT IF EXISTS "jobs_image_id_media_id_fk"',
  'DROP INDEX IF EXISTS "payload_web"."jobs_image_idx"',
  'ALTER TABLE "payload_web"."jobs" DROP COLUMN IF EXISTS "image_id"',
] as const

async function runStatements(
  db: { execute: MigrateUpArgs['db']['execute'] },
  statements: readonly string[],
): Promise<void> {
  for (const statement of statements) {
    await db.execute(sql.raw(statement))
  }
}

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await runStatements(db, jobsImageUpStatements)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await runStatements(db, jobsImageDownStatements)
}
