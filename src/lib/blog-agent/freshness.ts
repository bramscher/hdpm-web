export const RESEARCH_WINDOW_DAYS = 30
export const RESEARCH_WINDOW_MS = RESEARCH_WINDOW_DAYS * 24 * 60 * 60 * 1000

export interface SourceEvidence {
  title?: string
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
  if (hasStaleOverviewTitle(source.title || '', now)) return false
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

/** Catch explicitly obsolete overview headlines independently of model review.
 * Comparisons containing the current year need semantic review instead.
 */
export function hasStaleOverviewTitle(title: string, now = Date.now()): boolean {
  if (!/market|overview|outlook|forecast|report|update|trends|year.in.review/i.test(title)) return false
  const years = [...title.matchAll(/\b(20\d{2})\b/g)].map(match => Number(match[1]))
  return years.length > 0 && Math.max(...years) < new Date(now).getUTCFullYear()
}

export function requireCurrentReportingPeriod(review: unknown, title: string, now = Date.now()) {
  const verdict = review as { approved?: unknown; timeSensitive?: unknown; reportingPeriodCurrent?: unknown; reason?: unknown } | null
  if (hasStaleOverviewTitle(title, now) || !verdict || verdict.approved !== true ||
    typeof verdict.timeSensitive !== 'boolean' ||
    ((verdict.timeSensitive || /market|overview|outlook|forecast|report|update|trends/i.test(title)) && verdict.reportingPeriodCurrent !== true)) {
    throw new SourceGroundingError('Editorial review could not establish a current reporting period supported by the source. No draft was saved.')
  }
}
