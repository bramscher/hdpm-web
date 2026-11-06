-- Opt-in cleanup, step 2 of 3: APPLY. Run step 1 first and check its counts.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
--
-- Touches ONLY: leads with sms_opt_in = true and no sms_consent_at (sets
-- sms_opt_in = false), and leads with email_opt_in = true and no
-- email_consent_at (sets email_opt_in = false). Each field is judged on its own.
-- Never touches: any field with recorded consent, any opt-in that is already
-- false, and every other column. Prior values are copied to
-- payload_web.lead_opt_in_cleanup_backup first, in the same transaction;
-- step 3 restores them.

BEGIN;

CREATE TABLE IF NOT EXISTS "payload_web"."lead_opt_in_cleanup_backup" (
  "lead_id" integer PRIMARY KEY,
  "sms_opt_in" boolean,
  "email_opt_in" boolean,
  "sms_cleared" boolean NOT NULL,
  "email_cleared" boolean NOT NULL,
  "backed_up_at" timestamp(3) with time zone NOT NULL DEFAULT now()
);

-- A lead already in the backup from an earlier run keeps its first backup row.
INSERT INTO "payload_web"."lead_opt_in_cleanup_backup"
  ("lead_id", "sms_opt_in", "email_opt_in", "sms_cleared", "email_cleared")
SELECT
  "id", "sms_opt_in", "email_opt_in",
  ("sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL),
  ("email_opt_in" IS TRUE AND "email_consent_at" IS NULL)
FROM "payload_web"."leads"
WHERE ("sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL)
   OR ("email_opt_in" IS TRUE AND "email_consent_at" IS NULL)
ON CONFLICT ("lead_id") DO NOTHING;

UPDATE "payload_web"."leads"
SET
  "sms_opt_in" = CASE WHEN "sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL THEN false ELSE "sms_opt_in" END,
  "email_opt_in" = CASE WHEN "email_opt_in" IS TRUE AND "email_consent_at" IS NULL THEN false ELSE "email_opt_in" END
WHERE (("sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL)
    OR ("email_opt_in" IS TRUE AND "email_consent_at" IS NULL))
  AND "id" IN (SELECT "lead_id" FROM "payload_web"."lead_opt_in_cleanup_backup");

COMMIT;

-- Check: both counts should now be 0.
SELECT
  count(*) FILTER (WHERE "sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL)     AS sms_opt_ins_without_consent,
  count(*) FILTER (WHERE "email_opt_in" IS TRUE AND "email_consent_at" IS NULL) AS email_opt_ins_without_consent,
  (SELECT count(*) FROM "payload_web"."lead_opt_in_cleanup_backup")            AS leads_in_backup
FROM "payload_web"."leads";
