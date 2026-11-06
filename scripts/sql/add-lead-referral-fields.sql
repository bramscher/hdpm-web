-- One pipeline: partner referrals from the HDPM OS partner portal become owner
-- leads. Adds the referral id, partner id and partner name to leads, and a
-- unique referral id to lead_activities for the note that links a referral to
-- an existing lead. Additive and nullable; no existing rows change.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
-- Run AFTER scripts/sql/add-lead-growth-fields.sql (#75).
-- Mirrors src/migrations/20261106_140000_add_lead_referral_fields.ts and
-- records it as applied so `payload migrate` will not run it again.

BEGIN;

ALTER TABLE "payload_web"."leads"
  ADD COLUMN IF NOT EXISTS "referral_partner_name" varchar,
  ADD COLUMN IF NOT EXISTS "referral_partner_id" varchar,
  ADD COLUMN IF NOT EXISTS "referral_lead_id" varchar;
CREATE INDEX IF NOT EXISTS "leads_referral_partner_id_idx"
  ON "payload_web"."leads" USING btree ("referral_partner_id");
CREATE UNIQUE INDEX IF NOT EXISTS "leads_referral_lead_id_idx"
  ON "payload_web"."leads" USING btree ("referral_lead_id");

ALTER TABLE "payload_web"."lead_activities"
  ADD COLUMN IF NOT EXISTS "referral_lead_id" varchar;
CREATE UNIQUE INDEX IF NOT EXISTS "lead_activities_referral_lead_id_idx"
  ON "payload_web"."lead_activities" USING btree ("referral_lead_id");

INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '20261106_140000_add_lead_referral_fields', COALESCE(MAX("batch"), 0) + 1, now(), now()
FROM "payload_web"."payload_migrations"
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_web"."payload_migrations"
  WHERE "name" = '20261106_140000_add_lead_referral_fields'
);

COMMIT;

-- Check: should list the three indexes.
SELECT "indexname" FROM pg_indexes
WHERE "schemaname" = 'payload_web'
  AND "indexname" IN ('leads_referral_partner_id_idx', 'leads_referral_lead_id_idx', 'lead_activities_referral_lead_id_idx');
