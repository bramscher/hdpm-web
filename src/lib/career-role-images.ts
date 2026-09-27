import type { Job, Media } from '@/payload-types'

const roleImages = {
  'accounting-bookkeeper-ap-ar':
    'Bookkeeper reviewing an invoice at a wood desk beside a Mac in a bright Central Oregon office.',
  'property-manager':
    'Property manager checking a tablet outside a Central Oregon home with junipers and Cascade mountains beyond.',
  'office-assistant':
    'Office assistant working at a Mac desktop in a bright office overlooking high-desert landscaping.',
  'assistant-maintenance-coordinator':
    'Maintenance coordinator using a headset, notebook, and Mac to organize work orders.',
  'maintenance-technician':
    'Maintenance technician in work clothes carefully adjusting a rental home’s door hinge.',
  'landscape-technician':
    'Landscape technician wearing gloves and a sun hat tending native plants in Central Oregon.',
  'cleaning-technician':
    'Cleaning technician wearing gloves and a work polo wiping a bright rental-home kitchen counter.',
} as const

function mediaUrl(image: Media): string | null {
  return (
    image.url ||
    image.sizes?.card?.url ||
    image.sizes?.thumbnail?.url ||
    image.thumbnailURL ||
    null
  )
}

function mediaRoleImage(job: { title: string; image?: Job['image'] }) {
  const image = job.image
  if (!image || typeof image !== 'object') return null
  const src = mediaUrl(image)
  if (!src) return null
  return { src, alt: image.alt?.trim() || job.title }
}

function staticRoleImage(job: { slug: string; title: string }) {
  const titleSlug = job.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  const role = (Object.keys(roleImages) as Array<keyof typeof roleImages>).find(
    (key) =>
      job.slug === key || job.slug.startsWith(`${key}-`) || titleSlug === key,
  )
  return role
    ? { src: `/images/careers/${role}.webp`, alt: roleImages[role] }
    : null
}

/**
 * Careers card photo. A populated Media Role photo wins. Otherwise use the
 * static WebP matched by slug or title. Unrecognized roles return null so the
 * card keeps the numbered list.
 */
export function careerRoleImage(job: {
  slug: string
  title: string
  image?: Job['image']
}) {
  return mediaRoleImage(job) ?? staticRoleImage(job)
}
