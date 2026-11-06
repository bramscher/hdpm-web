-- Opt-in cleanup, step 3 of 3: UNDO. Only if step 2 must be reversed.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
--
-- Restores a cleared channel from payload_web.lead_opt_in_cleanup_backup ONLY
-- when nothing has happened to it since the cleanup:
--   - the lead has not been saved since (updated_at unchanged; every save
--     through the website, HDPM OS or Payload admin changes it),
--   - the channel is still false and still has no recorded consent,
--   - and that backup row has not been restored already.
-- Anything else may be a later opt-out or a later choice, so it is never
-- reversed automatically: the last query lists those rows for a person to review.
-- The backup table is kept; drop it by hand once the cleanup is final:
--   DROP TABLE "payload_web"."lead_opt_in_cleanup_backup";

BEGIN;

-- Hold off every other write to leads until COMMIT, so a save can't slip in
-- between the checks below and the restore, and two runs of this file (or
-- this and step 2) queue up. Reads carry on; form submissions and lead saves
-- wait for the few seconds this takes. If the lock isn't free within 10
-- seconds the script stops with an error and changes nothing.
SET LOCAL lock_timeout = '10s';
LOCK TABLE "payload_web"."leads" IN SHARE ROW EXCLUSIVE MODE;

-- Only the newest backup row per lead and channel can be restored.
CREATE TEMP TABLE "restorable" ON COMMIT DROP AS
SELECT b."id", b."lead_id", b."channel", b."prior_value", b."lead_updated_at"
FROM "payload_web"."lead_opt_in_cleanup_backup" AS b
JOIN "payload_web"."leads" AS l ON l."id" = b."lead_id"
WHERE b."restored_at" IS NULL
  AND b."id" = (
    SELECT max(n."id") FROM "payload_web"."lead_opt_in_cleanup_backup" AS n
    WHERE n."lead_id" = b."lead_id" AND n."channel" = b."channel"
  )
  AND l."updated_at" IS NOT DISTINCT FROM b."lead_updated_at"
  AND (
    (b."channel" = 'sms' AND l."sms_opt_in" IS FALSE AND l."sms_consent_at" IS NULL)
    OR (b."channel" = 'email' AND l."email_opt_in" IS FALSE AND l."email_consent_at" IS NULL)
  );

-- The conditions are checked again on the row being written.
UPDATE "payload_web"."leads" AS l
SET "sms_opt_in" = r."prior_value"
FROM "restorable" AS r
WHERE r."lead_id" = l."id" AND r."channel" = 'sms'
  AND l."updated_at" IS NOT DISTINCT FROM r."lead_updated_at"
  AND l."sms_opt_in" IS FALSE AND l."sms_consent_at" IS NULL;

UPDATE "payload_web"."leads" AS l
SET "email_opt_in" = r."prior_value"
FROM "restorable" AS r
WHERE r."lead_id" = l."id" AND r."channel" = 'email'
  AND l."updated_at" IS NOT DISTINCT FROM r."lead_updated_at"
  AND l."email_opt_in" IS FALSE AND l."email_consent_at" IS NULL;

UPDATE "payload_web"."lead_opt_in_cleanup_backup" AS b
SET "restored_at" = now()
FROM "restorable" AS r
WHERE r."id" = b."id";

COMMIT;

-- Check: cleared channels NOT restored because something changed since. Review
-- these by hand; restore one only if you know the person did not opt out.
SELECT b."lead_id", b."channel", b."prior_value", b."cleared_at",
       l."updated_at" AS lead_updated_at_now, b."lead_updated_at" AS lead_updated_at_at_cleanup
FROM "payload_web"."lead_opt_in_cleanup_backup" AS b
JOIN "payload_web"."leads" AS l ON l."id" = b."lead_id"
WHERE b."restored_at" IS NULL
  AND b."id" = (
    SELECT max(n."id") FROM "payload_web"."lead_opt_in_cleanup_backup" AS n
    WHERE n."lead_id" = b."lead_id" AND n."channel" = b."channel"
  )
ORDER BY b."lead_id", b."channel";
