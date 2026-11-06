-- Opt-in cleanup, step 3 of 3: UNDO. Only if step 2 must be reversed.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
--
-- Restores each opt-in that step 2 cleared, from
-- payload_web.lead_opt_in_cleanup_backup. A field is restored only if it is
-- still false; a value someone has changed since is left alone. The backup
-- table is kept; drop it by hand once the cleanup is final:
--   DROP TABLE "payload_web"."lead_opt_in_cleanup_backup";

BEGIN;

UPDATE "payload_web"."leads" AS l
SET
  "sms_opt_in" = CASE WHEN b."sms_cleared" AND l."sms_opt_in" IS FALSE THEN b."sms_opt_in" ELSE l."sms_opt_in" END,
  "email_opt_in" = CASE WHEN b."email_cleared" AND l."email_opt_in" IS FALSE THEN b."email_opt_in" ELSE l."email_opt_in" END
FROM "payload_web"."lead_opt_in_cleanup_backup" AS b
WHERE b."lead_id" = l."id";

COMMIT;

-- Check: how many backed-up leads are opted in again.
SELECT
  count(*) FILTER (WHERE l."sms_opt_in" IS TRUE AND b."sms_cleared")     AS sms_restored,
  count(*) FILTER (WHERE l."email_opt_in" IS TRUE AND b."email_cleared") AS email_restored
FROM "payload_web"."leads" AS l
JOIN "payload_web"."lead_opt_in_cleanup_backup" AS b ON b."lead_id" = l."id";
