-- hdpm-web: ALL schema changes for the 2026-11-06 batch, in one file.
-- #75, #76, #78, #79 and #81's hiring-settings fix. Paste into the Supabase SQL
-- editor and run, BEFORE deploying the merged code (the new code reads these
-- columns). It is also safe while the current site is running; see the PR.
--
-- Each part is ONE self-contained statement (a DO block) copied unchanged from
-- that PR's own file in scripts/sql/, so each part is all-or-nothing however the
-- editor sends the file, and the whole file is safe to run more than once. The
-- per-PR files and this file do the same thing and can be mixed in any order.
--
-- NOT included (run separately):
--   - #80's opt-in cleanup: only AFTER the merged code is deployed and checked.
--   - remove-duplicate-hiring-settings-migration.sql (#81): only if the check at
--     the end shows hiring settings recorded more than once.
--
-- Ends with a read-only check: every row should say ok = true.

-- ===== #75: Owner growth board: leads.expected_doors and leads.status_entered_at (days in stage), with the status_entered_at backfill.
-- Same as scripts/sql/add-lead-growth-fields.sql (branch feature/growth-pipeline).
DO $migration$
BEGIN
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

  INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
  SELECT '20261106_120000_add_lead_growth_fields', next_batch, now(), now()
  FROM (SELECT COALESCE(MAX("batch"), 0) + 1 AS next_batch FROM "payload_web"."payload_migrations") AS m
  WHERE NOT EXISTS (
    SELECT 1 FROM "payload_web"."payload_migrations"
    WHERE "name" = '20261106_120000_add_lead_growth_fields'
  );
END
$migration$;

-- ===== #76: One pipeline: referral id, partner id and partner name on leads; referral id on lead_activities; their indexes (two unique).
-- Same as scripts/sql/add-lead-referral-fields.sql (branch feature/one-pipeline-referrals).
DO $migration$
BEGIN
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
  SELECT '20261106_140000_add_lead_referral_fields', next_batch, now(), now()
  FROM (SELECT COALESCE(MAX("batch"), 0) + 1 AS next_batch FROM "payload_web"."payload_migrations") AS m
  WHERE NOT EXISTS (
    SELECT 1 FROM "payload_web"."payload_migrations"
    WHERE "name" = '20261106_140000_add_lead_referral_fields'
  );
END
$migration$;

-- ===== #78: Consent: sms_opt_in and email_opt_in default to false. Changes the column defaults only; no rows change.
-- Same as scripts/sql/consent-defaults-off.sql (branch fix/consent-defaults-off).
DO $migration$
BEGIN
  ALTER TABLE "payload_web"."leads"
    ALTER COLUMN "sms_opt_in" SET DEFAULT false,
    ALTER COLUMN "email_opt_in" SET DEFAULT false;

  INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
  SELECT '20261106_150000_consent_defaults_off', next_batch, now(), now()
  FROM (SELECT COALESCE(MAX("batch"), 0) + 1 AS next_batch FROM "payload_web"."payload_migrations") AS m
  WHERE NOT EXISTS (
    SELECT 1 FROM "payload_web"."payload_migrations"
    WHERE "name" = '20261106_150000_consent_defaults_off'
  );
END
$migration$;

-- ===== #79: Consent evidence: sms_consent_at, email_consent_at, consent_form and consent_wording_version on leads.
-- Same as scripts/sql/add-lead-consent-evidence.sql (branch feature/consent-boxes).
DO $migration$
BEGIN
  ALTER TABLE "payload_web"."leads"
    ADD COLUMN IF NOT EXISTS "sms_consent_at" timestamp(3) with time zone,
    ADD COLUMN IF NOT EXISTS "email_consent_at" timestamp(3) with time zone,
    ADD COLUMN IF NOT EXISTS "consent_form" varchar,
    ADD COLUMN IF NOT EXISTS "consent_wording_version" varchar;

  INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
  SELECT '20261106_160000_add_lead_consent_evidence', next_batch, now(), now()
  FROM (SELECT COALESCE(MAX("batch"), 0) + 1 AS next_batch FROM "payload_web"."payload_migrations") AS m
  WHERE NOT EXISTS (
    SELECT 1 FROM "payload_web"."payload_migrations"
    WHERE "name" = '20261106_160000_add_lead_consent_evidence'
  );
END
$migration$;

-- ===== #81: Hiring Settings (already live): re-applying is a no-op; this version records its migration once instead of twice.
-- Same as scripts/sql/add-hiring-settings.sql (branch fix/hiring-settings-sql-once).
DO $migration$
BEGIN
  CREATE TABLE IF NOT EXISTS "payload_web"."hiring_settings" (
    "id" serial PRIMARY KEY NOT NULL,
    "application_recipients" varchar NOT NULL,
    "resend_since" timestamp(3) with time zone,
    "last_resend" varchar,
    "updated_at" timestamp(3) with time zone,
    "created_at" timestamp(3) with time zone
  );

  INSERT INTO "payload_web"."hiring_settings" ("application_recipients", "updated_at", "created_at")
  SELECT E'work@highdesertpm.com\ncraig@highdesertpm.com\nlisa@highdesertpm.com', now(), now()
  WHERE NOT EXISTS (SELECT 1 FROM "payload_web"."hiring_settings");

  -- The batch is computed in a subquery so that a second run inserts nothing.
  INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
  SELECT '20261005_120000_add_hiring_settings', next_batch, now(), now()
  FROM (SELECT COALESCE(MAX("batch"), 0) + 1 AS next_batch FROM "payload_web"."payload_migrations") AS m
  WHERE NOT EXISTS (
    SELECT 1 FROM "payload_web"."payload_migrations"
    WHERE "name" = '20261005_120000_add_hiring_settings'
  );
END
$migration$;

-- ===== Check (read-only): every row should say ok = true.
SELECT "item", "ok" FROM (
  SELECT 1 AS "n", '#75 leads.status_entered_at and leads.expected_doors exist' AS "item",
    (SELECT count(*) FROM information_schema.columns WHERE "table_schema" = 'payload_web' AND "table_name" = 'leads'
       AND "column_name" IN ('status_entered_at', 'expected_doors')) = 2 AS "ok"
  UNION ALL
  SELECT 2, '#75 every lead has status_entered_at',
    NOT EXISTS (SELECT 1 FROM "payload_web"."leads" WHERE "status_entered_at" IS NULL)
  UNION ALL
  SELECT 3, '#76 three referral columns on leads, one on lead_activities',
    (SELECT count(*) FROM information_schema.columns WHERE "table_schema" = 'payload_web'
       AND (("table_name" = 'leads' AND "column_name" IN ('referral_partner_name', 'referral_partner_id', 'referral_lead_id'))
         OR ("table_name" = 'lead_activities' AND "column_name" = 'referral_lead_id'))) = 4
  UNION ALL
  SELECT 4, '#76 three referral indexes exist',
    (SELECT count(*) FROM pg_indexes WHERE "schemaname" = 'payload_web' AND "indexname" IN
       ('leads_referral_partner_id_idx', 'leads_referral_lead_id_idx', 'lead_activities_referral_lead_id_idx')) = 3
  UNION ALL
  SELECT 5, '#78 sms_opt_in and email_opt_in default to false',
    (SELECT count(*) FROM information_schema.columns WHERE "table_schema" = 'payload_web' AND "table_name" = 'leads'
       AND "column_name" IN ('sms_opt_in', 'email_opt_in') AND "column_default" = 'false') = 2
  UNION ALL
  SELECT 6, '#79 four consent evidence columns exist',
    (SELECT count(*) FROM information_schema.columns WHERE "table_schema" = 'payload_web' AND "table_name" = 'leads'
       AND "column_name" IN ('sms_consent_at', 'email_consent_at', 'consent_form', 'consent_wording_version')) = 4
  UNION ALL
  SELECT 7, '#81 hiring_settings has one row',
    (SELECT count(*) FROM "payload_web"."hiring_settings") = 1
  UNION ALL
  SELECT 8, 'each of the five migrations is recorded exactly once (if false for hiring settings only, run remove-duplicate-hiring-settings-migration.sql)',
    NOT EXISTS (
      SELECT 1 FROM (VALUES
        ('20261106_120000_add_lead_growth_fields'), ('20261106_140000_add_lead_referral_fields'),
        ('20261106_150000_consent_defaults_off'), ('20261106_160000_add_lead_consent_evidence'),
        ('20261005_120000_add_hiring_settings')) AS expected("name")
      WHERE (SELECT count(*) FROM "payload_web"."payload_migrations" AS m WHERE m."name" = expected."name") <> 1
    )
) AS checks
ORDER BY "n";
