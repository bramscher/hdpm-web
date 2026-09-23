export const RESEARCH_WINDOW_DAYS = 30
export const RESEARCH_WINDOW_MS = RESEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000

export interface SourceEvidence {
  sourceUrl?: string
  sourcePublishedAt?: string
  sourceDateBasis?: 'published' | 'published-or-updated'
  sourceExcerpt?: string
}

export function isRecentSource(date: unknown, now = Date.now()): boolean {
  if (typeof date !== 'string' || !date.trim()) return false
  const timestamp = Date.parse(date)
  return Number.isFinite(timestamp) && timestamp <= now && timestamp >= now - RESEARCH_WINDOW_MS
}

export function hasRecentEvidence(source: SourceEvidence, now = Date.now()): boolean {
  if (!isRecentSource(source.sourcePublishedAt, now) || typeof source.sourceExcerpt !== 'string' || source.sourceExcerpt.trim().length < 120) return false
  try {
    const url = new URL(source.sourceUrl || '')
    return ['https:', 'http:'].includes(url.protocol) && !url.username && !url.password
  } catch { return false }
}

export function sourceDateFromReddit(seconds: number): string | undefined {
  const date = new Date(seconds * 1000)
  return Number.isFinite(seconds) && seconds > 0 && Number.isFinite(date.getTime()) ? date.toISOString() : undefined
}

export function researchDateRange(now = Date.now()) {
  return { start_date: new Date(now - RESEARCH_WINDOW_MS).toISOString().slice(0, 10), end_date: new Date(now).toISOString().slice(0, 10) }
}

export class SourceGroundingError extends Error {}

export function requireRecentEvidence(source: SourceEvidence, now = Date.now()) {
  if (!hasRecentEvidence(source, now)) throw new SourceGroundingError('A dated source from the past 30 days and its actual text are required. Run topic research again; no draft was created.')
}
