-- Opt-in cleanup, step 3 of 3: UNDO. Only if step 2 must be reversed.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
--
-- The change is ONE statement (the DO block below), so it runs as a single
-- all-or-nothing transaction however the editor sends it. It uses no temporary
-- tables and no settings carried between statements. (Its first version used a
-- temporary table, which failed in the editor with "relation restorable does
-- not exist"; that failure changed no data.)
--
-- Restores a cleared channel from payload_web.lead_opt_in_cleanup_backup ONLY
-- when nothing has happened to it since the cleanup:
--   - the lead has not been saved since (updated_at unchanged; every save
--     through the website, HDPM OS or Payload admin changes it),
--   - the channel is still false and still has no recorded consent,
--   - and it is the newest backup row for that channel, not restored already.
-- Anything else may be a later opt-out or a later choice, so it is never
-- reversed automatically: the last query lists those rows for a person to review.
--
-- Locks payload_web.leads against other writes while it runs (reads carry on);
-- if the lock isn't free within 10 seconds it stops and changes nothing.
-- The backup table is kept; drop it by hand once the cleanup is final:
--   DROP TABLE "payload_web"."lead_opt_in_cleanup_backup";

DO $undo$
BEGIN
  -- Nothing to undo if step 2 never ran.
  IF to_regclass('"payload_web"."lead_opt_in_cleanup_backup"') IS NULL THEN
    RETURN;
  END IF;

  SET LOCAL lock_timeout = '10s';
  LOCK TABLE "payload_web"."leads" IN SHARE ROW EXCLUSIVE MODE;

  WITH "restorable" AS (
    SELECT b."id", b."lead_id", b."channel", b."prior_value"
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
      )
  ), "per_lead" AS (
    -- One row per lead, so a lead with both channels is updated once.
    SELECT "lead_id",
           bool_or("channel" = 'sms')                           AS "restore_sms",
           bool_or("prior_value") FILTER (WHERE "channel" = 'sms')   AS "sms_prior",
           bool_or("channel" = 'email')                         AS "restore_email",
           bool_or("prior_value") FILTER (WHERE "channel" = 'email') AS "email_prior"
    FROM "restorable"
    GROUP BY "lead_id"
  ), "restored" AS (
    UPDATE "payload_web"."leads" AS l
    SET
      "sms_opt_in" = CASE WHEN p."restore_sms" THEN p."sms_prior" ELSE l."sms_opt_in" END,
      "email_opt_in" = CASE WHEN p."restore_email" THEN p."email_prior" ELSE l."email_opt_in" END
    FROM "per_lead" AS p
    WHERE p."lead_id" = l."id"
    RETURNING l."id"
  )
  UPDATE "payload_web"."lead_opt_in_cleanup_backup" AS b
  SET "restored_at" = now()
  FROM "restorable" AS r
  WHERE r."id" = b."id" AND r."lead_id" IN (SELECT "id" FROM "restored");
END
$undo$;

-- Check: cleared channels NOT restored because something changed since. Review
-- these by hand; restore one only if you know the person did not opt out.
-- (Errors with "does not exist" only if step 2 never ran; then there is nothing to undo.)
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
