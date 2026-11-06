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
      email_consent_at timestamp(3) with time zone
    );
    INSERT INTO payload_web.leads VALUES
      (1, 'a@example.com', true,  true,  NULL, NULL),          -- saved before the boxes: both cleared
      (2, 'b@example.com', true,  true,  ${CONSENTED}, NULL),  -- real SMS consent kept; email cleared
      (3, 'c@example.com', true,  true,  ${CONSENTED}, ${CONSENTED}), -- real consent for both: untouched
      (4, 'd@example.com', false, false, NULL, NULL),          -- already opted out: untouched
      (5, 'e@example.com', false, true,  NULL, NULL),          -- email only, no consent: cleared
      (6, 'f@example.com', NULL,  NULL,  NULL, NULL);          -- unknown: untouched
  `)
  return db
}
const optIns = async (db: PGlite) =>
  (await db.query<{ id: number; sms_opt_in: boolean | null; email_opt_in: boolean | null }>(
    'SELECT id, sms_opt_in, email_opt_in FROM payload_web.leads ORDER BY id',
  )).rows.map((r) => [r.id, r.sms_opt_in, r.email_opt_in])

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

test('apply clears only opt-ins with no recorded consent, and backs them up first', async () => {
  const db = await database()
  await db.exec(APPLY)
  assert.deepEqual(await optIns(db), AFTER)
  const backup = await db.query<{ lead_id: number; sms_opt_in: boolean; email_opt_in: boolean; sms_cleared: boolean; email_cleared: boolean }>(
    'SELECT lead_id, sms_opt_in, email_opt_in, sms_cleared, email_cleared FROM payload_web.lead_opt_in_cleanup_backup ORDER BY lead_id',
  )
  assert.deepEqual(backup.rows.map((r) => [r.lead_id, r.sms_opt_in, r.email_opt_in, r.sms_cleared, r.email_cleared]), [
    [1, true, true, true, true],
    [2, true, true, false, true],
    [5, false, true, false, true],
  ])
  // Running it again changes nothing and keeps the first backup.
  await db.exec(APPLY)
  assert.deepEqual(await optIns(db), AFTER)
  assert.equal((await db.query('SELECT 1 FROM payload_web.lead_opt_in_cleanup_backup')).rows.length, 3)
})

test('a lead that ticks a box after the cleanup is never cleared by a re-run', async () => {
  const db = await database()
  await db.exec(APPLY)
  await db.exec(`UPDATE payload_web.leads SET email_opt_in = true, email_consent_at = ${CONSENTED} WHERE id = 1`)
  await db.exec(APPLY)
  assert.deepEqual((await optIns(db))[0], [1, false, true])
})

test('undo restores exactly what apply cleared', async () => {
  const db = await database()
  await db.exec(APPLY)
  await db.exec(UNDO)
  assert.deepEqual(await optIns(db), BEFORE)
  await db.exec(UNDO)
  assert.deepEqual(await optIns(db), BEFORE, 'undo is safe to run twice')
})
