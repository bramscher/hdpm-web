import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Optional résumé and video links from the careers form.
 * Run this before deploying: the site reads these columns on every application.
 *
 *   npm run payload -- migrate
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."job_applications"
      ADD COLUMN IF NOT EXISTS "resume_link" varchar,
      ADD COLUMN IF NOT EXISTS "video_link" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."job_applications"
      DROP COLUMN IF EXISTS "resume_link",
      DROP COLUMN IF EXISTS "video_link";
  `)
}
