import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Consent evidence for the website's SMS and email consent boxes: when each box
 * was ticked, on which form, and which wording version was shown. Additive and
 * nullable; existing leads keep empty evidence, which marks them as saved before
 * the consent boxes existed. Run after 20261106_150000_consent_defaults_off:
 *
 *   npm run payload -- migrate
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."leads"
      ADD COLUMN IF NOT EXISTS "sms_consent_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "email_consent_at" timestamp(3) with time zone,
      ADD COLUMN IF NOT EXISTS "consent_form" varchar,
      ADD COLUMN IF NOT EXISTS "consent_wording_version" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."leads"
      DROP COLUMN IF EXISTS "sms_consent_at",
      DROP COLUMN IF EXISTS "email_consent_at",
      DROP COLUMN IF EXISTS "consent_form",
      DROP COLUMN IF EXISTS "consent_wording_version";
  `)
}
