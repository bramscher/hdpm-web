import assert from 'node:assert/strict'
import test from 'node:test'
import { requireOsAdmin } from '../src/lib/os-service-auth'

const TOKEN = 'a'.repeat(40)
const call = (headers: Record<string, string>) =>
  requireOsAdmin(new Request('https://example.com/api/os/hiring', { headers }))

test('OS admin endpoints require the dedicated token and a company actor', () => {
  const saved = process.env.HDPM_OS_ADMIN_TOKEN
  process.env.HDPM_OS_ADMIN_TOKEN = TOKEN
  try {
    const ok = call({ authorization: `Bearer ${TOKEN}`, 'x-hdpm-actor': 'Craig@HighDesertPM.com' })
    assert.equal(ok.ok, true)
    assert.equal(ok.ok && ok.caller.actor, 'craig@highdesertpm.com')
    assert.equal(call({ authorization: `Bearer ${TOKEN}` }).ok, false)
    assert.equal(call({ authorization: `Bearer ${TOKEN}`, 'x-hdpm-actor': 'x@gmail.com' }).ok, false)
    assert.equal(call({ authorization: 'Bearer wrong', 'x-hdpm-actor': 'craig@highdesertpm.com' }).ok, false)
    assert.equal(call({ 'x-hdpm-actor': 'craig@highdesertpm.com' }).ok, false)
  } finally {
    if (saved) process.env.HDPM_OS_ADMIN_TOKEN = saved
    else delete process.env.HDPM_OS_ADMIN_TOKEN
  }
})

test('a missing or short configured token rejects every call', () => {
  const saved = process.env.HDPM_OS_ADMIN_TOKEN
  try {
    for (const value of [undefined, 'short']) {
      if (value === undefined) delete process.env.HDPM_OS_ADMIN_TOKEN
      else process.env.HDPM_OS_ADMIN_TOKEN = value
      assert.equal(call({ authorization: `Bearer ${value ?? ''}`, 'x-hdpm-actor': 'craig@highdesertpm.com' }).ok, false)
    }
  } finally {
    if (saved) process.env.HDPM_OS_ADMIN_TOKEN = saved
    else delete process.env.HDPM_OS_ADMIN_TOKEN
  }
})
