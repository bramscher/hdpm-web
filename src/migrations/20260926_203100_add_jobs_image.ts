import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Optional role photo on Jobs.
 *
 * Adds a nullable `image_id` foreign key to the existing Media collection,
 * matching other upload fields (for example team member photos). Existing job
 * rows are left unchanged — the column stays null until an editor attaches a
 * photo in Payload admin. This migration does not upload or seed images.
 *
 * Run before or with the deploy that reads the field:
 *   npm run payload -- migrate
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."jobs" ADD COLUMN IF NOT EXISTS "image_id" integer;
    ALTER TABLE "payload_web"."jobs" ADD CONSTRAINT "jobs_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload_web"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "jobs_image_idx" ON "payload_web"."jobs" USING btree ("image_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."jobs" DROP CONSTRAINT IF EXISTS "jobs_image_id_media_id_fk";
    DROP INDEX IF EXISTS "payload_web"."jobs_image_idx";
    ALTER TABLE "payload_web"."jobs" DROP COLUMN IF EXISTS "image_id";
  `)
}
