-- Owner lead pipeline: consult booked → proposal sent → signed.
-- Paste into the Supabase SQL editor before deploying the code that uses them.
-- Safe to re-run.

ALTER TYPE payload_web.enum_leads_status ADD VALUE IF NOT EXISTS 'consult_booked' BEFORE 'lost';
ALTER TYPE payload_web.enum_leads_status ADD VALUE IF NOT EXISTS 'proposal_sent' BEFORE 'lost';
ALTER TYPE payload_web.enum_leads_status ADD VALUE IF NOT EXISTS 'signed' BEFORE 'lost';
