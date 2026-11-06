import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'

// The three pasteable cleanup files, run for real against an in-memory Postgres
// (PGlite) holding a minimal leads table with fake rows.
const sqlFile = (step: string) => readFileSync(`scripts/sql/clear-unconsented-opt-ins-${step}.sql`, 'utf8')
const DRY_RUN = sqlFile('1-dry-run')
const APPLY = sqlFile('2-apply')
const UNDO = sqlFile('3-undo')

const CONSENTED = "'2026-11-07T10:00:00Z'"
const SAVED = "'2026-11-01T00:00:00Z'"
async function database() {
  const db = new PGlite()
  await db.exec(`
    CREATE SCHEMA payload_web;
    CREATE TABLE payload_web.leads (
      id integer PRIMARY KEY,
      email varchar,
      sms_opt_in boolean DEFAULT false,
      email_opt_in boolean DEFAULT false,
      sms_consent_at timestamp(3) with time zone,
      email_consent_at timestamp(3) with time zone,
      updated_at timestamp(3) with time zone NOT NULL DEFAULT ${SAVED}
    );
    INSERT INTO payload_web.leads (id, email, sms_opt_in, email_opt_in, sms_consent_at, email_consent_at) VALUES
      (1, 'a@example.com', true,  true,  NULL, NULL),                 -- saved before the boxes: both cleared
      (2, 'b@example.com', true,  true,  ${CONSENTED}, NULL),         -- real SMS consent kept; email cleared
      (3, 'c@example.com', true,  true,  ${CONSENTED}, ${CONSENTED}), -- real consent for both: untouched
      (4, 'd@example.com', false, false, NULL, NULL),                 -- already opted out: untouched
      (5, 'e@example.com', false, true,  NULL, NULL),                 -- email only, no consent: cleared
      (6, 'f@example.com', NULL,  NULL,  NULL, NULL);                 -- unknown: untouched
  `)
  return db
}
const optIns = async (db: PGlite) =>
  (await db.query<{ id: number; sms_opt_in: boolean | null; email_opt_in: boolean | null }>(
    'SELECT id, sms_opt_in, email_opt_in FROM payload_web.leads ORDER BY id',
  )).rows.map((r) => [r.id, r.sms_opt_in, r.email_opt_in])
const lead = async (db: PGlite, id: number) => (await optIns(db)).find((row) => row[0] === id)
/** What a save through the website, HDPM OS or Payload admin does: change the row and updated_at. */
const appSave = (db: PGlite, id: number, set: string) =>
  db.exec(`UPDATE payload_web.leads SET ${set}, updated_at = now() WHERE id = ${id}`)
const reviewList = async (db: PGlite) => {
  const results = await db.exec(UNDO)
  return results[results.length - 1].rows.map((r: any) => [r.lead_id, r.channel, r.prior_value])
}

const BEFORE = [[1, true, true], [2, true, true], [3, true, true], [4, false, false], [5, false, true], [6, null, null]]
const AFTER = [[1, false, false], [2, true, false], [3, true, true], [4, false, false], [5, false, false], [6, null, null]]

test('the dry run counts what would change and changes nothing', async () => {
  const db = await database()
  const [counts] = (await db.query<Record<string, number>>(DRY_RUN)).rows
  assert.deepEqual(
    Object.fromEntries(Object.entries(counts).map(([k, v]) => [k, Number(v)])),
    { sms_opt_ins_to_clear: 1, email_opt_ins_to_clear: 3, leads_to_change: 3, leads_with_recorded_consent_kept: 2, total_leads: 6 },
  )
  assert.deepEqual(await optIns(db), BEFORE)
  const tables = await db.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_opt_in_cleanup_backup'")
  assert.equal(tables.rows.length, 0, 'the dry run creates no backup table')
})

test('apply clears only opt-ins with no recorded consent, backing up each cleared channel', async () => {
  const db = await database()
  await db.exec(APPLY)
  assert.deepEqual(await optIns(db), AFTER)
  const backup = await db.query<{ lead_id: number; channel: string; prior_value: boolean }>(
    'SELECT lead_id, channel, prior_value FROM payload_web.lead_opt_in_cleanup_backup ORDER BY lead_id, channel',
  )
  assert.deepEqual(backup.rows.map((r) => [r.lead_id, r.channel, r.prior_value]), [
    [1, 'email', true], [1, 'sms', true], [2, 'email', true], [5, 'email', true],
  ])
  const touched = await db.query("SELECT 1 FROM payload_web.leads WHERE updated_at <> '2026-11-01T00:00:00Z'")
  assert.equal(touched.rows.length, 0, 'apply leaves updated_at alone')
  // Running it again changes nothing and adds no backup rows.
  await db.exec(APPLY)
  assert.deepEqual(await optIns(db), AFTER)
  assert.equal((await db.query('SELECT 1 FROM payload_web.lead_opt_in_cleanup_backup')).rows.length, 4)
})

test('a lead that ticks a box after the cleanup is never cleared by a re-run', async () => {
  const db = await database()
  await db.exec(APPLY)
  await appSave(db, 1, `email_opt_in = true, email_consent_at = ${CONSENTED}`)
  await db.exec(APPLY)
  assert.deepEqual(await lead(db, 1), [1, false, true])
})

test('undo restores exactly what apply cleared, once', async () => {
  const db = await database()
  await db.exec(APPLY)
  assert.deepEqual(await reviewList(db), [], 'nothing left to review')
  assert.deepEqual(await optIns(db), BEFORE)
  await db.exec(UNDO)
  assert.deepEqual(await optIns(db), BEFORE, 'undo is safe to run twice')
})

test('undo never reverses a later opt-in-then-opt-out', async () => {
  const db = await database()
  await db.exec(APPLY)
  // The person ticks the SMS box (evidence), then opts out again.
  await appSave(db, 1, `sms_opt_in = true, sms_consent_at = ${CONSENTED}`)
  await appSave(db, 1, 'sms_opt_in = false')
  const review = await reviewList(db)
  assert.deepEqual(await lead(db, 1), [1, false, false], 'the opt-out stands')
  assert.deepEqual(review.filter((r: unknown[]) => r[0] === 1), [[1, 'email', true], [1, 'sms', true]])
  // Even with no evidence, any save since the cleanup blocks the automatic restore.
  const other = await database()
  await other.exec(APPLY)
  await appSave(other, 5, "email = 'e2@example.com'")
  await other.exec(UNDO)
  assert.deepEqual(await lead(other, 5), [5, false, false])
})

test('a re-run that clears a newly opted-in channel backs it up so undo can restore it', async () => {
  const db = await database()
  await db.exec(`UPDATE payload_web.leads SET sms_opt_in = true, email_opt_in = false WHERE id = 1`)
  await db.exec(APPLY) // clears SMS only
  await appSave(db, 1, 'email_opt_in = true') // email turned on later with no evidence
  await db.exec(APPLY) // clears email, with its own backup row
  assert.deepEqual(await lead(db, 1), [1, false, false])
  const rows = await db.query<{ channel: string; prior_value: boolean }>(
    'SELECT channel, prior_value FROM payload_web.lead_opt_in_cleanup_backup WHERE lead_id = 1 ORDER BY id',
  )
  assert.deepEqual(rows.rows.map((r) => [r.channel, r.prior_value]), [['sms', true], ['email', true]])
  // Email was cleared by the last writer, so it is restored. SMS was cleared
  // before a later save, so it is listed for a person to review instead.
  const review = await reviewList(db)
  assert.deepEqual(await lead(db, 1), [1, false, true])
  assert.deepEqual(review.filter((r: unknown[]) => r[0] === 1), [[1, 'sms', true]])
})
