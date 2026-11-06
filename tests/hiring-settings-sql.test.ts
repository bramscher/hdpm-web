import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { runAsEditor, splitStatements } from './sql-editor-model'

// Runs the two pasteable files for real against an in-memory Postgres (PGlite),
// the way the Supabase SQL editor might send them: as one script, or statement
// by statement on fresh sessions.
const ADD = readFileSync('scripts/sql/add-hiring-settings.sql', 'utf8')
const DEDUPE = readFileSync('scripts/sql/remove-duplicate-hiring-settings-migration.sql', 'utf8')
const NAME = '20261005_120000_add_hiring_settings'

async function database() {
  const db = new PGlite()
  await db.exec(`
    CREATE SCHEMA payload_web;
    CREATE TABLE payload_web.payload_migrations (
      id serial PRIMARY KEY, name varchar, batch numeric,
      updated_at timestamp(3) with time zone, created_at timestamp(3) with time zone
    );
    INSERT INTO payload_web.payload_migrations (name, batch) VALUES ('20260927_180000_rewrite_job_apply_instructions', 5);
  `)
  return db
}
const records = async (db: PGlite) =>
  (await db.query<{ id: number; batch: string }>(
    `SELECT id, batch FROM payload_web.payload_migrations WHERE name = '${NAME}' ORDER BY id`,
  )).rows.map((r) => [r.id, Number(r.batch)])

for (const mode of ['script', 'per-statement'] as const) {
  const how = mode === 'script' ? 'as one script' : 'statement by statement'
  test(`pasting add-hiring-settings.sql twice ${how} records the migration once and keeps one settings row`, async () => {
    const db = await database()
    await runAsEditor(db, ADD, mode)
    await runAsEditor(db, ADD, mode)
    assert.deepEqual(await records(db), [[2, 6]])
    assert.equal((await db.query('SELECT 1 FROM payload_web.hiring_settings')).rows.length, 1)
  })

  test(`the duplicate cleanup ${how} keeps the earliest record and is safe to re-run`, async () => {
    const db = await database()
    // The state the old file left after two pastes: the real record, then a batch-1 duplicate.
    await db.exec(`INSERT INTO payload_web.payload_migrations (name, batch) VALUES ('${NAME}', 6), ('${NAME}', 1)`)
    const results = await runAsEditor(db, DEDUPE, mode)
    assert.deepEqual(results[0].rows.map((r: any) => r.id), [3], 'the preview lists only the duplicate')
    assert.deepEqual(await records(db), [[2, 6]])
    assert.equal(results[results.length - 1].rows.length, 1, 'the check shows one row')
    await runAsEditor(db, DEDUPE, mode)
    assert.deepEqual(await records(db), [[2, 6]])
    // Other migrations are never touched.
    assert.equal((await db.query('SELECT 1 FROM payload_web.payload_migrations')).rows.length, 2)
  })

  test(`with no duplicate, the cleanup ${how} deletes nothing`, async () => {
    const db = await database()
    await runAsEditor(db, ADD, mode)
    const results = await runAsEditor(db, DEDUPE, mode)
    assert.equal(results[0].rows.length, 0)
    assert.deepEqual(await records(db), [[2, 6]])
  })
}

test('neither file depends on session state between statements', () => {
  for (const [name, sql] of [['add', ADD], ['dedupe', DEDUPE]]) {
    for (const statement of splitStatements(sql)) {
      assert.doesNotMatch(statement, /^(BEGIN|COMMIT|SET LOCAL|LOCK TABLE)\b/i, `${name}: ${statement.slice(0, 20)}`)
      assert.doesNotMatch(statement, /\bTEMP(ORARY)?\s+TABLE\b/i, `${name}: temp table`)
    }
  }
})
