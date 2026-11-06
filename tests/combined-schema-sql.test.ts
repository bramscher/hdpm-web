import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { runAsEditor, splitStatements } from './sql-editor-model'

// The one-file schema SQL for the 2026-11-06 batch, run the way the Supabase SQL
// editor might (one script, or statement by statement on fresh sessions).
const COMBINED = readFileSync('scripts/sql/2026-11-06-all-schema-changes.sql', 'utf8')
const EVIDENCE_ONLY = readFileSync('scripts/sql/add-lead-consent-evidence.sql', 'utf8')

async function database({ hiringLive = false } = {}) {
  const db = new PGlite()
  await db.exec(`
    CREATE SCHEMA payload_web;
    CREATE TYPE payload_web.enum_leads_status AS ENUM ('new','engaged','consult_booked','signed','lost');
    CREATE TABLE payload_web.leads (
      id serial PRIMARY KEY, status payload_web.enum_leads_status DEFAULT 'new',
      sms_opt_in boolean DEFAULT true, email_opt_in boolean DEFAULT true,
      created_at timestamp(3) with time zone NOT NULL DEFAULT now(),
      updated_at timestamp(3) with time zone NOT NULL DEFAULT now()
    );
    CREATE TABLE payload_web.lead_activities (
      id serial PRIMARY KEY, lead_id integer NOT NULL, type varchar NOT NULL, metadata jsonb,
      created_at timestamp(3) with time zone NOT NULL DEFAULT now()
    );
    CREATE TABLE payload_web.payload_migrations (
      id serial PRIMARY KEY, name varchar, batch numeric,
      updated_at timestamp(3) with time zone, created_at timestamp(3) with time zone
    );
    INSERT INTO payload_web.payload_migrations (name, batch) VALUES ('20261104_120000_add_application_links', 7);
    INSERT INTO payload_web.leads (status, created_at) VALUES ('engaged', '2026-10-01'), ('new', '2026-10-05');
    INSERT INTO payload_web.lead_activities (lead_id, type, metadata, created_at)
      VALUES (1, 'status_changed', '{"from":"new","to":"engaged"}', '2026-10-03');
  `)
  if (hiringLive) {
    await db.exec(`
      CREATE TABLE payload_web.hiring_settings (
        id serial PRIMARY KEY NOT NULL, application_recipients varchar NOT NULL,
        resend_since timestamp(3) with time zone, last_resend varchar,
        updated_at timestamp(3) with time zone, created_at timestamp(3) with time zone);
      INSERT INTO payload_web.hiring_settings (application_recipients) VALUES ('team@example.com');
      INSERT INTO payload_web.payload_migrations (name, batch) VALUES ('20261005_120000_add_hiring_settings', 6);
    `)
  }
  return db
}
const checks = (results: Array<{ rows: any[] }>) =>
  results[results.length - 1].rows.map((r) => [r.item, r.ok])
const allOk = (results: Array<{ rows: any[] }>) => {
  const rows = checks(results)
  assert.equal(rows.length, 8)
  for (const [item, ok] of rows) assert.equal(ok, true, item)
}

for (const mode of ['script', 'per-statement'] as const) {
  const how = mode === 'script' ? 'as one script' : 'statement by statement'
  test(`the combined file applies every change ${how}, twice, from a fresh database`, async () => {
    const db = await database()
    allOk(await runAsEditor(db, COMBINED, mode))
    allOk(await runAsEditor(db, COMBINED, mode))
    const backfill = await db.query('SELECT id, status_entered_at FROM payload_web.leads ORDER BY id')
    assert.deepEqual(backfill.rows.map((r: any) => r.status_entered_at.toISOString()),
      ['2026-10-03T00:00:00.000Z', '2026-10-05T00:00:00.000Z'])
    const newLead = await db.query('INSERT INTO payload_web.leads DEFAULT VALUES RETURNING sms_opt_in, email_opt_in')
    assert.deepEqual(newLead.rows[0], { sms_opt_in: false, email_opt_in: false })
  })

  test(`the combined file ${how} leaves live hiring settings alone and mixes with per-PR files`, async () => {
    const db = await database({ hiringLive: true })
    await runAsEditor(db, EVIDENCE_ONLY, mode) // #79's own file pasted first
    allOk(await runAsEditor(db, COMBINED, mode))
    const settings = await db.query('SELECT application_recipients FROM payload_web.hiring_settings')
    assert.deepEqual(settings.rows, [{ application_recipients: 'team@example.com' }])
    await runAsEditor(db, EVIDENCE_ONLY, mode) // and again after
    allOk(await runAsEditor(db, COMBINED, mode))
  })
}

test('the check flags a duplicate hiring settings record left by the old file', async () => {
  const db = await database({ hiringLive: true })
  await db.exec(`INSERT INTO payload_web.payload_migrations (name, batch) VALUES ('20261005_120000_add_hiring_settings', 1)`)
  const rows = checks(await runAsEditor(db, COMBINED, 'script'))
  assert.equal(rows.find(([item]) => String(item).startsWith('each of the five'))![1], false)
})

test('the combined file is the five per-PR DO blocks and nothing that depends on session state', () => {
  const statements = splitStatements(COMBINED)
  assert.equal(statements.filter((s) => s.startsWith('DO $migration$')).length, 5)
  assert.equal(statements.length, 6, 'five DO blocks and the check query')
  for (const statement of statements) {
    assert.doesNotMatch(statement, /^(BEGIN|COMMIT|SET LOCAL|LOCK TABLE)\b/i)
    assert.doesNotMatch(statement, /\bTEMP(ORARY)?\s+TABLE\b/i)
  }
  // #79's block here is byte-identical to its own file on this branch.
  const evidenceBlock = splitStatements(EVIDENCE_ONLY).find((s) => s.startsWith('DO $migration$'))!
  assert.ok(statements.includes(evidenceBlock))
})
