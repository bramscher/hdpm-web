import assert from 'node:assert/strict'
import test from 'node:test'
import { JobApplications } from '../src/collections/JobApplications'
import {
  MAX_ATTACHMENT_BYTES,
  loadApplicationAttachments,
  parseRecipients,
  validateRecipients,
} from '../src/lib/career-notification'

const notify = JobApplications.hooks!.afterChange![0]
const doc = {
  id: 42,
  fullName: 'Sam Example',
  email: 'sam@example.com',
  jobTitle: 'Office Assistant',
  notificationStatus: 'pending',
  experience: 'Office work',
  technology: 'Shared calendars',
}

test('private applications deny public reads and writes and allow administrator review', () => {
  const access = JobApplications.access!
  for (const role of [undefined, 'viewer', 'editor', 'api']) {
    const args = { req: { user: role ? { role } : undefined } } as any
    assert.equal((access.read as Function)(args), false)
    assert.equal((access.update as Function)(args), false)
    assert.equal((access.delete as Function)(args), false)
  }
  assert.equal(
    (access.read as Function)({ req: { user: { role: 'admin' } } }),
    true,
  )
  assert.equal((access.create as Function)({ req: {} }), false)
})

test('missing email configuration marks an already-saved application failed without throwing', async () => {
  const key = process.env.RESEND_API_KEY
  delete process.env.RESEND_API_KEY
  const updates: any[] = []
  try {
    const result = await notify({
      doc,
      context: {},
      req: {
        payload: {
          update: async (args: any) => {
            updates.push(args)
          },
        },
      },
    } as any)
    assert.equal(result.id, 42)
    assert.equal(result.notificationStatus, 'failed')
    assert.equal(updates[0].data.notificationStatus, 'failed')
    assert.equal(updates[0].context.skipCareerEmail, true)
  } finally {
    if (key) process.env.RESEND_API_KEY = key
  }
})

test('notification sends the form to the hiring inbox and records delivery; nested updates do not resend', async () => {
  const key = process.env.RESEND_API_KEY
  const originalFetch = globalThis.fetch
  process.env.RESEND_API_KEY = 're_test_placeholder'
  const updates: any[] = []
  let sent: any
  globalThis.fetch = async (_url, init) => {
    sent = JSON.parse(String(init?.body))
    return new Response(JSON.stringify({ id: 'test-email' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const req = {
      payload: {
        update: async (args: any) => {
          updates.push(args)
        },
      },
    }
    await notify({ doc, context: {}, req } as any)
    assert.deepEqual(sent.to, [
      'work@highdesertpm.com',
      'craig@highdesertpm.com',
      'lisa@highdesertpm.com',
    ])
    assert.equal(sent.reply_to, 'sam@example.com')
    assert.match(sent.text, /Shared calendars/)
    assert.equal(updates[0].data.notificationStatus, 'sent')
    sent = undefined
    await notify({ doc, context: { skipCareerEmail: true }, req } as any)
    assert.equal(sent, undefined)
  } finally {
    globalThis.fetch = originalFetch
    if (key) process.env.RESEND_API_KEY = key
    else delete process.env.RESEND_API_KEY
  }
})

test('notification uses the recipients saved in Hiring Settings', async () => {
  const key = process.env.RESEND_API_KEY
  const originalFetch = globalThis.fetch
  process.env.RESEND_API_KEY = 're_test_placeholder'
  let sent: any
  globalThis.fetch = async (_url, init) => {
    sent = JSON.parse(String(init?.body))
    return new Response(JSON.stringify({ id: 'test-email' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }
  try {
    const req = {
      payload: {
        findGlobal: async () => ({
          applicationRecipients: 'Hiring@HighDesertPM.com\nnot-an-email\n',
        }),
        update: async () => {},
      },
    }
    await notify({ doc, context: {}, req } as any)
    assert.deepEqual(sent.to, ['hiring@highdesertpm.com'])
  } finally {
    globalThis.fetch = originalFetch
    if (key) process.env.RESEND_API_KEY = key
    else delete process.env.RESEND_API_KEY
  }
})

test('recipient lists accept one address per line and reject invalid entries', () => {
  assert.deepEqual(parseRecipients(' a@x.com\nB@x.com, a@x.com\n\n'), [
    'a@x.com',
    'b@x.com',
  ])
  assert.equal(validateRecipients('a@x.com\nb@x.com'), true)
  assert.match(String(validateRecipients('a@x.com\nnope')), /nope/)
  assert.match(String(validateRecipients('  ')), /at least one/)
})

test('oversized videos are listed for the download link instead of attached', async () => {
  const { attached, skipped } = await loadApplicationAttachments([
    {
      kind: 'video',
      name: 'intro.mov',
      path: 'x/intro.mov',
      size: MAX_ATTACHMENT_BYTES + 1,
    },
  ])
  assert.equal(attached.length, 0)
  assert.match(skipped[0], /intro\.mov.*too large/)
})
