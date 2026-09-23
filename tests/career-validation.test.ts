import assert from 'node:assert/strict'
import test from 'node:test'
import {
  validateApplication,
  validateUpload,
} from '../src/lib/career-validation'
import {
  readAttachment,
  signAttachment,
  sameOrigin,
} from '../src/lib/career-storage'

const application = {
  submissionId: '9722e282-2a69-49cf-93a1-ecf7b1f0ba36',
  jobId: '4',
  fullName: '  Sam Example  ',
  email: 'sam@example.com',
  phone: '555-123-4567',
  experience: 'I maintain homes.',
  technology: 'I track work orders on my phone.',
  availability: 'Weekdays',
  consent: true,
}
test('validates and normalizes a complete application', () => {
  assert.equal(validateApplication(application).fullName, 'Sam Example')
  assert.equal(validateApplication(application).jobId, 4)
})
test('rejects missing consent, malformed email, missing answers, invalid job IDs, and oversized input', () => {
  for (const update of [
    { consent: false },
    { email: 'nope' },
    { technology: ' ' },
    { experience: 'x'.repeat(5001) },
    { jobId: -1 },
    { jobId: 'NaN' },
    { submissionId: '../test' },
  ])
    assert.throws(() => validateApplication({ ...application, ...update }))
})
test('accepts supported résumé and video formats; rejects disguised extensions and oversized files', () => {
  assert.equal(
    validateUpload('resume', 'Resume.PDF', 1024).mime,
    'application/pdf',
  )
  assert.equal(
    validateUpload('video', 'intro.mov', 100 * 1024 * 1024).mime,
    'video/quicktime',
  )
  for (const args of [
    ['resume', 'resume.pdf.exe', 10],
    ['video', 'intro.mp4', 100 * 1024 * 1024 + 1],
    ['resume', 'empty.pdf', 0],
    ['resume', 'large.pdf', 10 * 1024 * 1024 + 1],
    ['other', 'file.pdf', 20],
  ])
    assert.throws(() =>
      validateUpload(...(args as [unknown, unknown, unknown])),
    )
})
test('upload receipts are signed, expiring, and bound to one application', () => {
  process.env.PAYLOAD_SECRET = 'test-only-career-signing-secret'
  const file = {
    kind: 'resume' as const,
    name: 'resume.pdf',
    path: 'private/test.pdf',
    size: 500,
    mime: 'application/pdf',
    submissionId: application.submissionId,
    expires: Date.now() + 10000,
  }
  const token = signAttachment(file)
  assert.deepEqual(readAttachment(token, application.submissionId), file)
  assert.throws(() => readAttachment(`${token}a`, application.submissionId))
  assert.throws(() => readAttachment(token, 'another-application'))
  assert.throws(() =>
    readAttachment(
      signAttachment({ ...file, expires: 0 }),
      application.submissionId,
    ),
  )
})
test('rejects cross-origin and missing-origin submission requests', () => {
  assert.equal(
    sameOrigin(
      new Request('https://example.com/api', {
        headers: { origin: 'https://example.com' },
      }),
    ),
    true,
  )
  assert.equal(
    sameOrigin(
      new Request('https://example.com/api', {
        headers: { origin: 'https://other.com' },
      }),
    ),
    false,
  )
  assert.equal(sameOrigin(new Request('https://example.com/api')), false)
})
