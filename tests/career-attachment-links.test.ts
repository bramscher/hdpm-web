import assert from 'node:assert/strict'
import test from 'node:test'
import {
  attachmentLoginPath,
  attachmentPreviewPath,
  safeAttachmentReturn,
} from '../src/lib/career-attachment-links'

const id = '9722e282-2a69-49cf-93a1-ecf7b1f0ba36'
test('email attachment destinations survive login and OAuth state round trips', () => {
  for (const kind of ['resume', 'video']) {
    const path = attachmentPreviewPath(id, kind)!
    const login = new URL(
      attachmentLoginPath(path),
      'https://www.highdesertpm.com',
    )
    assert.equal(login.pathname, '/admin/login')
    assert.equal(login.searchParams.get('redirect'), path)
    const authorize = new URL(
      `/api/users/oauth/authorize?state=${encodeURIComponent(path)}`,
      'https://www.highdesertpm.com',
    )
    assert.equal(
      safeAttachmentReturn(authorize.searchParams.get('state')),
      path,
    )
  }
})
test('rejects external destinations, arbitrary local routes, extra parameters, and invalid files', () => {
  for (const value of [
    null,
    undefined,
    ['bad'],
    'https://evil.example',
    '//evil.example',
    '/admin',
    `/careers/application-files/${id}?kind=resume&next=https://evil.example`,
    `/careers/application-files/${id}?kind=resume#other`,
    '/careers/application-files/../admin?kind=resume',
    `/careers/application-files/${id}?kind=other`,
  ]) {
    assert.equal(safeAttachmentReturn(value), null)
  }
  assert.equal(attachmentPreviewPath('../admin', 'resume'), null)
  assert.equal(attachmentPreviewPath(id, null), null)
  assert.equal(attachmentLoginPath('https://evil.example'), '/admin/login')
})
