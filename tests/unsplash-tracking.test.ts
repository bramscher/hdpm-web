import assert from 'node:assert/strict'
import test from 'node:test'
import { trackUnsplashDownload } from '../src/lib/unsplash-tracking'

test('tracking rejects untrusted destinations without making a request', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response())
  for (const url of [
    undefined, null, {}, 'not-a-url',
    'https://attacker.example/photos/abc/download',
    'https://api.unsplash.com.attacker.example/photos/abc/download',
    'https://api.unsplash.com@attacker.example/photos/abc/download',
    'http://api.unsplash.com/photos/abc/download',
    'https://api.unsplash.com:8443/photos/abc/download',
    'https://user:password@api.unsplash.com/photos/abc/download',
    'https://api.unsplash.com/redirect',
    'https://api.unsplash.com/photos/abc%2fdef/download',
  ]) await trackUnsplashDownload(url, 'test-key')
  assert.equal(fetchMock.mock.callCount(), 0)
})

test('tracking preserves Unsplash query parameters and forbids credential-bearing redirects', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => new Response())
  await trackUnsplashDownload('https://api.unsplash.com/photos/abc-123/download?ixid=attribution', 'test-key')
  assert.equal(fetchMock.mock.callCount(), 1)
  const [url, options] = fetchMock.mock.calls[0].arguments
  assert.equal(String(url), 'https://api.unsplash.com/photos/abc-123/download?ixid=attribution')
  assert.deepEqual(options?.headers, { Authorization: 'Client-ID test-key' })
  assert.equal(options?.redirect, 'error')
  assert.ok(options?.signal)
})

test('missing credentials and network failures do not break successful imports', async (t) => {
  const fetchMock = t.mock.method(globalThis, 'fetch', async () => { throw new Error('timeout') })
  await trackUnsplashDownload('https://api.unsplash.com/photos/abc/download', '')
  assert.equal(fetchMock.mock.callCount(), 0)
  await assert.doesNotReject(trackUnsplashDownload('https://api.unsplash.com/photos/abc/download', 'test-key'))
})
