import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * One pipeline: partner referrals from the HDPM OS partner portal become owner
 * leads. Adds the HDPM OS referral id (unique, so a resent referral never makes
 * a second lead) and the referring partner's id and display name. Additive and
 * nullable; no existing rows change. Run after 20261106_120000_add_lead_growth_fields:
 *
 *   npm run payload -- migrate
 */

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_web"."leads"
      ADD COLUMN IF NOT EXISTS "referral_partner_name" varchar,
      ADD COLUMN IF NOT EXISTS "referral_partner_id" varchar,
      ADD COLUMN IF NOT EXISTS "referral_lead_id" varchar;
    CREATE INDEX IF NOT EXISTS "leads_referral_partner_id_idx" ON "payload_web"."leads" USING btree ("referral_partner_id");
    CREATE UNIQUE INDEX IF NOT EXISTS "leads_referral_lead_id_idx" ON "payload_web"."leads" USING btree ("referral_lead_id");
    ALTER TABLE "payload_web"."lead_activities" ADD COLUMN IF NOT EXISTS "referral_lead_id" varchar;
    CREATE UNIQUE INDEX IF NOT EXISTS "lead_activities_referral_lead_id_idx" ON "payload_web"."lead_activities" USING btree ("referral_lead_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "payload_web"."lead_activities_referral_lead_id_idx";
    ALTER TABLE "payload_web"."lead_activities" DROP COLUMN IF EXISTS "referral_lead_id";
    DROP INDEX IF EXISTS "payload_web"."leads_referral_lead_id_idx";
    DROP INDEX IF EXISTS "payload_web"."leads_referral_partner_id_idx";
    ALTER TABLE "payload_web"."leads"
      DROP COLUMN IF EXISTS "referral_lead_id",
      DROP COLUMN IF EXISTS "referral_partner_id",
      DROP COLUMN IF EXISTS "referral_partner_name";
  `)
}
