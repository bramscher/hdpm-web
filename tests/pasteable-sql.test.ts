import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { runAsEditor, splitStatements } from './sql-editor-model'

// Every pasteable SQL file on this branch, run the way the Supabase SQL editor
// might run it (one script, or each statement on its own session), twice, in
// paste order, against a database where earlier files have or haven't run.
const file = (name: string) => readFileSync(`scripts/sql/${name}.sql`, 'utf8')
const ORDER = [
  'add-lead-consent-evidence',
  'clear-unconsented-opt-ins-1-dry-run',
  'clear-unconsented-opt-ins-2-apply',
  'clear-unconsented-opt-ins-3-undo',
]

async function database() {
  const db = new PGlite()
  await db.exec(`
    CREATE SCHEMA payload_web;
    CREATE TABLE payload_web.leads (
      id serial PRIMARY KEY, email varchar,
      sms_opt_in boolean DEFAULT false, email_opt_in boolean DEFAULT false,
      updated_at timestamp(3) with time zone NOT NULL DEFAULT '2026-11-01T00:00:00Z'
    );
    CREATE TABLE payload_web.payload_migrations (
      id serial PRIMARY KEY, name varchar, batch numeric,
      updated_at timestamp(3) with time zone, created_at timestamp(3) with time zone
    );
    INSERT INTO payload_web.payload_migrations (name, batch) VALUES ('20261104_120000_add_application_links', 7);
    INSERT INTO payload_web.leads (email, sms_opt_in, email_opt_in) VALUES
      ('a@example.com', true, true), ('b@example.com', false, true), ('c@example.com', false, false);
  `)
  return db
}
const optIns = async (db: PGlite) =>
  (await db.query('SELECT id, sms_opt_in, email_opt_in FROM payload_web.leads ORDER BY id')).rows
    .map((r: any) => [r.id, r.sms_opt_in, r.email_opt_in])
const migrationCount = async (db: PGlite, name: string) =>
  (await db.query(`SELECT 1 FROM payload_web.payload_migrations WHERE name = '${name}'`)).rows.length

for (const mode of ['script', 'per-statement'] as const) {
  test(`every file runs cleanly ${mode === 'script' ? 'as one script' : 'statement by statement on fresh sessions'}, twice`, async () => {
    const db = await database()
    for (let round = 0; round < 2; round++) {
      for (const name of ORDER.filter((n) => !n.endsWith('3-undo'))) await runAsEditor(db, file(name), mode)
    }
    assert.equal(await migrationCount(db, '20261106_160000_add_lead_consent_evidence'), 1)
    assert.deepEqual(await optIns(db), [[1, false, false], [2, false, false], [3, false, false]])
    await runAsEditor(db, file('clear-unconsented-opt-ins-3-undo'), mode)
    await runAsEditor(db, file('clear-unconsented-opt-ins-3-undo'), mode)
    assert.deepEqual(await optIns(db), [[1, true, true], [2, false, true], [3, false, false]])
  })
}

test('undo before any cleanup changes nothing', async () => {
  const db = await database()
  await runAsEditor(db, file('add-lead-consent-evidence'), 'per-statement')
  // Its DO block is a no-op; only the final review query errors, since there is no backup table.
  await assert.rejects(runAsEditor(db, file('clear-unconsented-opt-ins-3-undo'), 'per-statement'), /does not exist/)
  assert.deepEqual(await optIns(db), [[1, true, true], [2, false, true], [3, false, false]])
})

test('no file depends on session state between statements', () => {
  for (const name of ORDER) {
    for (const statement of splitStatements(file(name))) {
      assert.doesNotMatch(statement, /^(BEGIN|COMMIT|SET LOCAL|LOCK TABLE)\b/i, `${name}: top-level ${statement.slice(0, 20)}`)
      assert.doesNotMatch(statement, /\bTEMP(ORARY)?\s+TABLE\b/i, `${name}: temp table`)
    }
  }
})
