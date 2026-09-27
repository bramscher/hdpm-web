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

const office = { slug: 'office-assistant', title: 'Office Assistant' }

test('prefers the Media Role photo over the static WebP', () => {
  assert.deepEqual(careerRoleImage({ ...office, image: media }), {
    src: '/api/media/file/office-assistant.jpg',
    alt: 'Office assistant at a desk',
  })
})

test('falls back to the job title when Media alt text is blank', () => {
  const image = careerRoleImage({ ...office, image: { ...media, alt: '  ' } })
  assert.ok(image)
  assert.equal(image.alt, 'Office Assistant')
  assert.equal(image.src, '/api/media/file/office-assistant.jpg')
})

test('uses a sized Media URL when the original URL is missing', () => {
  const sized = {
    ...media,
    url: null,
    sizes: { card: { url: '/api/media/file/office-assistant-card.jpg' } },
  }
  const image = careerRoleImage({ ...office, image: sized })
  assert.ok(image)
  assert.equal(image.src, '/api/media/file/office-assistant-card.jpg')
})

test('uses the static WebP when no Media photo is set', () => {
  assert.deepEqual(careerRoleImage({ ...office, image: null }), {
    src: '/images/careers/office-assistant.webp',
    alt: 'Office assistant working at a Mac desktop in a bright office overlooking high-desert landscaping.',
  })
  assert.equal(
    careerRoleImage({
      slug: 'maintenance-technician-8f3a1c',
      title: 'Draft title',
      image: undefined,
    })?.src,
    '/images/careers/maintenance-technician.webp',
  )
  assert.equal(
    careerRoleImage({ slug: 'custom-role', title: 'Landscape Technician' })?.src,
    '/images/careers/landscape-technician.webp',
  )
})

test('falls back to the static WebP when the Media relation is unpopulated or has no URL', () => {
  assert.equal(careerRoleImage({ ...office, image: 7 })?.src, '/images/careers/office-assistant.webp')
  assert.equal(
    careerRoleImage({ ...office, image: { ...media, url: null, sizes: {}, thumbnailURL: null } })?.src,
    '/images/careers/office-assistant.webp',
  )
})

test('returns null when neither a Media photo nor a static role image exists', () => {
  assert.equal(
    careerRoleImage({ slug: 'night-auditor', title: 'Night Auditor', image: null }),
    null,
  )
  assert.equal(
    careerRoleImage({
      slug: 'night-auditor',
      title: 'Night Auditor',
      image: { ...media, url: null, sizes: {}, thumbnailURL: null },
    }),
    null,
  )
})
