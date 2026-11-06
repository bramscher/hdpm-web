-- Consent evidence for the website's SMS and email consent boxes: when each box
-- was ticked, on which form, and which wording version was shown. Additive and
-- nullable; existing leads keep empty evidence, which marks them as saved
-- before the consent boxes existed.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
-- Run AFTER scripts/sql/consent-defaults-off.sql (#78).
-- Mirrors src/migrations/20261106_160000_add_lead_consent_evidence.ts and
-- records it as applied so `payload migrate` will not run it again.

BEGIN;

ALTER TABLE "payload_web"."leads"
  ADD COLUMN IF NOT EXISTS "sms_consent_at" timestamp(3) with time zone,
  ADD COLUMN IF NOT EXISTS "email_consent_at" timestamp(3) with time zone,
  ADD COLUMN IF NOT EXISTS "consent_form" varchar,
  ADD COLUMN IF NOT EXISTS "consent_wording_version" varchar;

INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '20261106_160000_add_lead_consent_evidence', COALESCE(MAX("batch"), 0) + 1, now(), now()
FROM "payload_web"."payload_migrations"
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_web"."payload_migrations"
  WHERE "name" = '20261106_160000_add_lead_consent_evidence'
);

COMMIT;

-- Check: should list the four columns.
SELECT "column_name" FROM information_schema.columns
WHERE "table_schema" = 'payload_web' AND "table_name" = 'leads'
  AND "column_name" IN ('sms_consent_at', 'email_consent_at', 'consent_form', 'consent_wording_version');
