import type { Job, Media } from '@/payload-types'

function mediaUrl(image: Media): string | null {
  return (
    image.url ||
    image.sizes?.card?.url ||
    image.sizes?.thumbnail?.url ||
    image.thumbnailURL ||
    null
  )
}

/** Public careers thumbnail from the Job's optional Media relation. */
export function careerRoleImage(job: Pick<Job, 'title' | 'image'>) {
  const image = job.image
  if (!image || typeof image !== 'object') return null
  const src = mediaUrl(image)
  if (!src) return null
  return { src, alt: image.alt?.trim() || job.title }
}
