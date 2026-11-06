import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Owner growth board: expected doors per lead and when the lead entered its
 * current status (days in stage). Run this before deploying: the leads API reads
 * both columns.
 *
 *   npm run payload -- migrate
 *
 * Backfill for existing leads: the time of the latest status_changed activity
 * that moved the lead INTO its current status; leads with no such history (never
 * moved since creation) use created_at. From now on the leads hook stamps it on
 * every status change.
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."leads"
      ADD COLUMN IF NOT EXISTS "status_entered_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "expected_doors" numeric;

    UPDATE "payload_web"."leads" AS l
    SET "status_entered_at" = COALESCE(
      (
        SELECT max(a."created_at")
        FROM "payload_web"."lead_activities" AS a
        WHERE a."lead_id" = l."id"
          AND a."type" = 'status_changed'
          AND a."metadata"->>'to' = l."status"::text
      ),
      l."created_at"
    )
    WHERE l."status_entered_at" IS NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."leads"
      DROP COLUMN IF EXISTS "status_entered_at",
      DROP COLUMN IF EXISTS "expected_doors";
  `)
}
