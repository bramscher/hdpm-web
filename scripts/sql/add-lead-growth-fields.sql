-- Owner growth board: expected doors per lead, and when the lead entered its
-- current status (days in stage).
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
-- Mirrors src/migrations/20261106_120000_add_lead_growth_fields.ts and records
-- it as applied so `payload migrate` will not run it again.
--
-- Backfill for existing leads: the time of the latest status_changed activity
-- that moved the lead INTO its current status; leads with no such history use
-- created_at. Only rows with no status_entered_at yet are filled.

BEGIN;

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

-- The batch is computed in a subquery so that a second run inserts nothing.
INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '20261106_120000_add_lead_growth_fields', next_batch, now(), now()
FROM (SELECT COALESCE(MAX("batch"), 0) + 1 AS next_batch FROM "payload_web"."payload_migrations") AS m
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_web"."payload_migrations"
  WHERE "name" = '20261106_120000_add_lead_growth_fields'
);

COMMIT;

-- Check: leads_missing_status_time should be 0.
SELECT
  count(*)                                       AS total_leads,
  count(*) FILTER (WHERE "status_entered_at" IS NULL) AS leads_missing_status_time,
  count(*) FILTER (WHERE "expected_doors" IS NOT NULL) AS leads_with_expected_doors
FROM "payload_web"."leads";
