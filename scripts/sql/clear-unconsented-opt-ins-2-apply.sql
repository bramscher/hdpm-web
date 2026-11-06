-- Opt-in cleanup, step 2 of 3: APPLY. Run step 1 first and check its counts.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
--
-- Touches ONLY: leads with sms_opt_in = true and no sms_consent_at (sets
-- sms_opt_in = false), and leads with email_opt_in = true and no
-- email_consent_at (sets email_opt_in = false). Each channel is judged on its own.
-- Never touches: any channel with recorded consent, any opt-in that is already
-- false, and every other column (including updated_at).
--
-- Before clearing, every channel this run clears gets its own backup row in
-- payload_web.lead_opt_in_cleanup_backup: the prior value and the lead's
-- updated_at at that moment, in the same statement as the clear. A later run that clears a
-- channel again adds a new row, so every change has a recoverable prior value.

BEGIN;

-- Hold off every other write to leads until COMMIT, so nothing can change
-- between the backup and the clear, and two runs of this file queue up. Reads
-- (the website showing pages, staff viewing leads) carry on. Form submissions
-- and lead saves wait for the few seconds this takes; if the lock isn't free
-- within 10 seconds the script stops with an error and changes nothing.
SET LOCAL lock_timeout = '10s';
LOCK TABLE "payload_web"."leads" IN SHARE ROW EXCLUSIVE MODE;

CREATE TABLE IF NOT EXISTS "payload_web"."lead_opt_in_cleanup_backup" (
  "id" serial PRIMARY KEY,
  "lead_id" integer NOT NULL,
  "channel" varchar NOT NULL CHECK ("channel" IN ('sms', 'email')),
  "prior_value" boolean NOT NULL,
  "lead_updated_at" timestamp(3) with time zone,
  "cleared_at" timestamp(3) with time zone NOT NULL DEFAULT now(),
  "restored_at" timestamp(3) with time zone
);

-- One statement: the backup rows it writes are exactly the channels it clears.
WITH "captured" AS (
  INSERT INTO "payload_web"."lead_opt_in_cleanup_backup" ("lead_id", "channel", "prior_value", "lead_updated_at")
  SELECT "id", 'sms', "sms_opt_in", "updated_at" FROM "payload_web"."leads"
  WHERE "sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL
  UNION ALL
  SELECT "id", 'email', "email_opt_in", "updated_at" FROM "payload_web"."leads"
  WHERE "email_opt_in" IS TRUE AND "email_consent_at" IS NULL
  RETURNING "lead_id", "channel"
), "per_lead" AS (
  SELECT "lead_id",
         bool_or("channel" = 'sms')   AS "clear_sms",
         bool_or("channel" = 'email') AS "clear_email"
  FROM "captured"
  GROUP BY "lead_id"
)
UPDATE "payload_web"."leads" AS l
SET
  "sms_opt_in" = CASE WHEN p."clear_sms" THEN false ELSE l."sms_opt_in" END,
  "email_opt_in" = CASE WHEN p."clear_email" THEN false ELSE l."email_opt_in" END
FROM "per_lead" AS p
WHERE p."lead_id" = l."id";

COMMIT;

-- Check: both "without consent" counts should now be 0.
SELECT
  count(*) FILTER (WHERE "sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL)     AS sms_opt_ins_without_consent,
  count(*) FILTER (WHERE "email_opt_in" IS TRUE AND "email_consent_at" IS NULL) AS email_opt_ins_without_consent,
  (SELECT count(*) FROM "payload_web"."lead_opt_in_cleanup_backup")            AS cleared_channels_backed_up
FROM "payload_web"."leads";
