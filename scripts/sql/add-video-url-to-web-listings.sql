-- Adds the nullable `video_url` column that stores a listing's YouTube video
-- tour URL (scraped from the AppFolio detail-page gallery during sync).
--
-- Safe + idempotent. Run once in the Supabase SQL editor (or psql) against the
-- project that backs web_listings, then trigger a listings refresh
-- (admin → Automations → "Refresh from AppFolio", or the scheduled cron) to
-- backfill values. Until this runs, the sync writes listings WITHOUT the video
-- (it detects the missing column and retries), detail-page videos still work
-- (scraped live), and grid video badges simply don't appear yet.

ALTER TABLE web_listings
  ADD COLUMN IF NOT EXISTS video_url text;
