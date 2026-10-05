import type { Payload } from 'payload'
import { careerStorage, type Attachment } from './career-storage'

export const DEFAULT_APPLICATION_RECIPIENTS = [
  'work@highdesertpm.com',
  'craig@highdesertpm.com',
  'lisa@highdesertpm.com',
]
// Resend rejects messages over 40 MB after base64 encoding (~4/3 growth), so
// keep raw attachments well under that. Résumés (10 MB max) always fit; large
// videos fall back to the admin link already included in the email body.
export const MAX_ATTACHMENT_BYTES = 28 * 1024 * 1024

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/

/** Split a one-per-line (or comma-separated) list into unique addresses. */
export function parseRecipients(value: unknown): string[] {
  if (typeof value !== 'string') return []
  const seen = new Set<string>()
  for (const part of value.split(/[\n,;]+/)) {
    const email = part.trim().toLowerCase()
    if (email) seen.add(email)
  }
  return [...seen]
}

export function validateRecipients(value: unknown): true | string {
  const emails = parseRecipients(value)
  if (!emails.length) return 'Enter at least one email address.'
  const invalid = emails.filter((email) => !EMAIL.test(email))
  return invalid.length
    ? `Not a valid email address: ${invalid.join(', ')}`
    : true
}

/** Recipients from Hiring Settings; falls back to the defaults so a missing or
 * unreadable setting never stops an application email. */
export async function getApplicationRecipients(
  payload: Payload,
): Promise<string[]> {
  try {
    const settings = await payload.findGlobal({
      slug: 'hiring-settings',
      depth: 0,
      overrideAccess: true,
    })
    const emails = parseRecipients(settings?.applicationRecipients).filter(
      (email) => EMAIL.test(email),
    )
    if (emails.length) return emails
  } catch (error) {
    console.error(
      '[careers] Could not read hiring settings; using default recipients',
      error instanceof Error ? error.message : 'Unknown error',
    )
  }
  return DEFAULT_APPLICATION_RECIPIENTS
}

export type EmailAttachment = { filename: string; content: Buffer }

/** Download the application's files from private storage for attaching.
 * Files that are too large or fail to download are listed in `skipped` so the
 * email can point to the admin link instead. */
export async function loadApplicationAttachments(files: unknown) {
  const attached: EmailAttachment[] = []
  const skipped: string[] = []
  if (!Array.isArray(files) || !files.length) return { attached, skipped }
  let budget = MAX_ATTACHMENT_BYTES
  // Résumé first so it is never crowded out by a video.
  const ordered = [...(files as Attachment[])].sort(
    (a, b) => Number(b.kind === 'resume') - Number(a.kind === 'resume'),
  )
  for (const file of ordered) {
    const label = `${file.name} (${(file.size / 1024 / 1024).toFixed(1)} MB)`
    if (file.size > budget) {
      skipped.push(`${label} — too large to attach`)
      continue
    }
    try {
      const { data, error } = await careerStorage().download(file.path)
      if (error || !data) throw error || new Error('Empty download')
      attached.push({
        filename: file.name,
        content: Buffer.from(await data.arrayBuffer()),
      })
      budget -= file.size
    } catch (error) {
      console.error(
        '[careers] Could not attach application file',
        file.kind,
        error instanceof Error ? error.message : 'Unknown error',
      )
      skipped.push(`${label} — could not be attached`)
    }
  }
  return { attached, skipped }
}
