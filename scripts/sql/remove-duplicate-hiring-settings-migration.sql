-- Remove duplicate payload_migrations records for the Hiring Settings migration.
--
-- Before the fix to scripts/sql/add-hiring-settings.sql, pasting that file a
-- second time added a second record for 20261005_120000_add_hiring_settings
-- (with batch 1). Only the migration record is duplicated; the hiring_settings
-- table and its row are not affected.
--
-- FIRST run only this check. Run the rest of the file ONLY if it shows more than
-- one row:
--
--   SELECT "id", "name", "batch", "created_at" FROM "payload_web"."payload_migrations"
--   WHERE "name" = '20261005_120000_add_hiring_settings' ORDER BY "id";
--
-- Then paste the whole file into the Supabase SQL editor and run it. It keeps
-- the earliest record (lowest id) and deletes the others. With no duplicate it
-- deletes nothing, and it is safe to run more than once.

-- What would be deleted (read-only): every record after the earliest.
SELECT "id", "name", "batch", "created_at" FROM "payload_web"."payload_migrations"
WHERE "name" = '20261005_120000_add_hiring_settings'
  AND "id" > (
    SELECT min("id") FROM "payload_web"."payload_migrations"
    WHERE "name" = '20261005_120000_add_hiring_settings'
  )
ORDER BY "id";

BEGIN;

DELETE FROM "payload_web"."payload_migrations"
WHERE "name" = '20261005_120000_add_hiring_settings'
  AND "id" > (
    SELECT min("id") FROM "payload_web"."payload_migrations"
    WHERE "name" = '20261005_120000_add_hiring_settings'
  );

COMMIT;

-- Check: should show exactly one row.
SELECT "id", "name", "batch", "created_at" FROM "payload_web"."payload_migrations"
WHERE "name" = '20261005_120000_add_hiring_settings'
ORDER BY "id";
