export const uploadRules = {
  resume: {
    max: 10 * 1024 * 1024,
    types: {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    },
  },
  video: {
    max: 100 * 1024 * 1024,
    types: { mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' },
  },
} as const
export type UploadKind = keyof typeof uploadRules
export function validateUpload(kind: unknown, name: unknown, size: unknown) {
  if (kind !== 'resume' && kind !== 'video')
    throw new Error('Choose a résumé or video file.')
  if (typeof name !== 'string' || name.length > 200)
    throw new Error('Please use a shorter filename.')
  const extension = name.split('.').pop()?.toLowerCase() || ''
  const rule = uploadRules[kind]
  const mime = (rule.types as Record<string, string>)[extension]
  if (
    !mime ||
    typeof size !== 'number' ||
    !Number.isInteger(size) ||
    size <= 0 ||
    size > rule.max
  ) {
    throw new Error(
      kind === 'resume'
        ? 'Use a PDF, DOC, or DOCX résumé up to 10 MB.'
        : 'Use an MP4, MOV, or WebM video up to 100 MB.',
    )
  }
  return { kind: kind as UploadKind, name, size, extension, mime }
}
export function validateApplication(input: Record<string, unknown>) {
  const field = (key: string, max: number, required = true) => {
    const value = typeof input[key] === 'string' ? input[key].trim() : ''
    if ((required && !value) || value.length > max)
      throw new Error(
        `Please check the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()} field.`,
      )
    return value
  }
  const email = field('email', 254)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new Error('Please enter a valid email address.')
  if (input.consent !== true)
    throw new Error('Please confirm that we may review your application.')
  const jobId = Number(input.jobId)
  if (!Number.isSafeInteger(jobId) || jobId < 1)
    throw new Error('Please choose an open position.')
  const submissionId = field('submissionId', 36)
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      submissionId,
    )
  )
    throw new Error('Please refresh the page and try again.')
  return {
    submissionId,
    jobId,
    fullName: field('fullName', 150),
    email,
    phone: field('phone', 50),
    experience: field('experience', 5000),
    technology: field('technology', 3000),
    availability: field('availability', 1000),
    consent: true,
  }
}
