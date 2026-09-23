import { FOUNDED_YEAR } from './constants'

export const HDPM_JOB_CONTEXT = `High Desert Property Management (HDPM) has served Central Oregon since ${FOUNDED_YEAR}. Service communities: Bend, Redmond, Sisters, Prineville, Culver, Metolius, and Madras. HDPM supports property owners and residents through residential property management, leasing, and maintenance coordination. Use a clear, welcoming, practical voice focused on service, communication, reliability, and care for homes.`

export type JobDraft = {
  title: string
  summary: string
  description: string
  location: string
  schedule: string
  compensation: string
  reviewNotes: string[]
}

export function readText(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
    throw new Error('Invalid or oversized text.')
  }
  return value.trim()
}

export function readQuestions(value: unknown): string[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 8) throw new Error('Expected 1–8 questions.')
  return value.map(question => readText(question, 500, true))
}

export function readJobDraft(value: unknown): JobDraft {
  if (!value || typeof value !== 'object') throw new Error('Missing draft.')
  const data = value as Record<string, unknown>
  if (!Array.isArray(data.reviewNotes) || data.reviewNotes.length > 12) throw new Error('Invalid review notes.')
  return {
    title: readText(data.title, 200, true),
    summary: readText(data.summary, 1200, true),
    description: readText(data.description, 20000, true),
    location: readText(data.location, 300),
    schedule: readText(data.schedule, 500),
    compensation: readText(data.compensation, 500),
    reviewNotes: data.reviewNotes.map(note => readText(note, 1000, true)),
  }
}

/** Text-only conversion: generated content never supplies HTML or editor nodes. */
export function jobDescriptionToLexical(text: string) {
  return {
    root: {
      type: 'root', direction: 'ltr' as const, format: '' as const, indent: 0, version: 1,
      children: text.split('\n').filter(line => line.trim()).map(line => {
        const isHeading = /^##? /.test(line)
        return {
          type: isHeading ? 'heading' : 'paragraph',
          ...(isHeading ? { tag: 'h2' } : {}),
          direction: 'ltr' as const, format: '' as const, indent: 0, version: 1,
          children: [{ type: 'text', text: line.replace(/^##? /, ''), format: 0, detail: 0, mode: 'normal', style: '', version: 1 }],
        }
      }),
    },
  }
}
