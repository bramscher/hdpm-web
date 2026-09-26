import assert from 'node:assert/strict'
import test from 'node:test'
import type { Media } from '../src/payload-types'
import { careerRoleImage } from '../src/lib/career-role-images'

const media = {
  id: 7,
  alt: 'Office assistant at a desk',
  updatedAt: '2026-09-26T00:00:00.000Z',
  createdAt: '2026-09-26T00:00:00.000Z',
  url: '/api/media/file/office-assistant.jpg',
} satisfies Media

test('returns the Media photo when a job has one', () => {
  assert.deepEqual(
    careerRoleImage({ title: 'Office Assistant', image: media }),
    { src: '/api/media/file/office-assistant.jpg', alt: 'Office assistant at a desk' },
  )
})

test('falls back to the job title when alt text is blank', () => {
  const image = careerRoleImage({ title: 'Office Assistant', image: { ...media, alt: '  ' } })
  assert.ok(image)
  assert.equal(image.alt, 'Office Assistant')
})

test('uses a sized Media URL when the original URL is missing', () => {
  const sized = {
    ...media,
    url: null,
    sizes: { card: { url: '/api/media/file/office-assistant-card.jpg' } },
  }
  const image = careerRoleImage({ title: 'Office Assistant', image: sized })
  assert.ok(image)
  assert.equal(image.src, '/api/media/file/office-assistant-card.jpg')
})

test('returns null when the photo is missing or not populated', () => {
  assert.equal(careerRoleImage({ title: 'Office Assistant', image: null }), null)
  assert.equal(careerRoleImage({ title: 'Office Assistant', image: undefined }), null)
  assert.equal(careerRoleImage({ title: 'Office Assistant', image: 7 }), null)
  assert.equal(
    careerRoleImage({ title: 'Office Assistant', image: { ...media, url: null } }),
    null,
  )
})
