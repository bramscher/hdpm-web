-- Hiring Settings: job application email recipients + one-time resend date.
-- Paste into the Supabase SQL editor and run. Safe to run more than once.
-- Mirrors src/migrations/20261005_120000_add_hiring_settings.ts and records it
-- as applied so `payload migrate` will not run it again.

BEGIN;

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

INSERT INTO "payload_web"."payload_migrations" ("name", "batch", "updated_at", "created_at")
SELECT '20261005_120000_add_hiring_settings', COALESCE(MAX("batch"), 0) + 1, now(), now()
FROM "payload_web"."payload_migrations"
WHERE NOT EXISTS (
  SELECT 1 FROM "payload_web"."payload_migrations"
  WHERE "name" = '20261005_120000_add_hiring_settings'
);

COMMIT;

-- Check: should return one row listing the three addresses.
SELECT "id", "application_recipients" FROM "payload_web"."hiring_settings";
