import assert from 'node:assert/strict'
import test from 'node:test'
import { HDPM_JOB_CONTEXT, jobDescriptionToLexical, readJobDraft, readQuestions, readText } from '../src/lib/job-description'

const draft = { title: 'Office Assistant', summary: 'Support our team.', description: '## Responsibilities\nHelp residents.', location: '', schedule: '', compensation: '', reviewNotes: ['Confirm schedule.'] }

test('requires complete draft content and keeps unknown employment terms blank', () => {
  assert.deepEqual(readJobDraft(draft), draft)
  assert.throws(() => readJobDraft({ ...draft, summary: '' }))
  assert.throws(() => readJobDraft({ ...draft, description: { root: {} } }))
  assert.throws(() => readJobDraft({ ...draft, compensation: 25 }))
  assert.throws(() => readJobDraft({ ...draft, reviewNotes: Array(13).fill('note') }))
})

test('only whitelisted draft fields survive validation', () => {
  const result = readJobDraft({ ...draft, status: 'open', id: 1, postingLinks: [{ url: 'javascript:alert(1)' }] })
  assert.equal('status' in result, false)
  assert.equal('id' in result, false)
  assert.equal('postingLinks' in result, false)
})

test('validates question count, content, and input bounds', () => {
  assert.deepEqual(readQuestions([' What hours? ']), ['What hours?'])
  for (const invalid of [[], Array(9).fill('Question?'), [''], [{}], null]) assert.throws(() => readQuestions(invalid))
  assert.throws(() => readText('x'.repeat(16001), 16000))
  assert.equal(readText('', 2000), '')
})

test('rich text keeps generated HTML as plain text and separates headings', () => {
  const result = jobDescriptionToLexical('## Responsibilities\n\n<script>alert(1)</script>')
  assert.equal(result.root.children.length, 2)
  assert.equal(result.root.children[0].type, 'heading')
  assert.equal(result.root.children[1].type, 'paragraph')
  assert.equal(result.root.children[1].children[0].text, '<script>alert(1)</script>')
})

test('company context uses the confirmed founding year', () => {
  assert.match(HDPM_JOB_CONTEXT, /since 1999/)
})
