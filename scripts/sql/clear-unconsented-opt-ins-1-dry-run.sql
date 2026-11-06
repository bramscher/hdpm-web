-- Opt-in cleanup, step 1 of 3: DRY RUN. Reads only; changes nothing.
-- Paste into the Supabase SQL editor and run.
--
-- Before #78 every website intake saved new leads as opted in to SMS and email
-- without asking. A lead has REAL consent only if the consent box was ticked,
-- which since #79 records sms_consent_at / email_consent_at. This counts the
-- opt-ins that have no recorded consent: exactly what step 2 would clear.
--
-- Needs #79's columns (sms_consent_at, email_consent_at). If they don't exist
-- yet, this errors with "column does not exist" and nothing happens.

SELECT
  count(*) FILTER (WHERE "sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL)     AS sms_opt_ins_to_clear,
  count(*) FILTER (WHERE "email_opt_in" IS TRUE AND "email_consent_at" IS NULL) AS email_opt_ins_to_clear,
  count(*) FILTER (
    WHERE ("sms_opt_in" IS TRUE AND "sms_consent_at" IS NULL)
       OR ("email_opt_in" IS TRUE AND "email_consent_at" IS NULL)
  )                                                                             AS leads_to_change,
  count(*) FILTER (WHERE "sms_consent_at" IS NOT NULL OR "email_consent_at" IS NOT NULL)
                                                                                AS leads_with_recorded_consent_kept,
  count(*)                                                                      AS total_leads
FROM "payload_web"."leads";
