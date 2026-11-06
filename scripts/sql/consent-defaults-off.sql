-- SMS and email consent are explicit opt-in: new leads default to not opted in.
-- Changes only the two column defaults. Existing leads keep their stored values
-- (clearing opt-ins saved without consent is a separate, deliberate step:
-- scripts/sql/clear-unconsented-opt-ins-*.sql).
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
-- Mirrors src/migrations/20261106_150000_consent_defaults_off.ts and records it
-- as applied so `payload migrate` will not run it again.

BEGIN;

ALTER TABLE "payload_web"."leads"
  ALTER COLUMN "sms_opt_in" SET DEFAULT false,
  ALTER COLUMN "email_opt_in" SET DEFAULT false;

-- The batch is computed in a subquery so that a second run inserts nothing.
INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '20261106_150000_consent_defaults_off', next_batch, now(), now()
FROM (SELECT COALESCE(MAX("batch"), 0) + 1 AS next_batch FROM "payload_web"."payload_migrations") AS m
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_web"."payload_migrations"
  WHERE "name" = '20261106_150000_consent_defaults_off'
);

COMMIT;

-- Check: both defaults should read false.
SELECT "column_name", "column_default" FROM information_schema.columns
WHERE "table_schema" = 'payload_web' AND "table_name" = 'leads'
  AND "column_name" IN ('sms_opt_in', 'email_opt_in');
