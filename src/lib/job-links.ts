/** Posting links must navigate to a website, never execute a URL scheme. */
export function isJobPostingURL(value: unknown): value is string {
  if (typeof value !== 'string' || value !== value.trim()) return false
  try {
    const url = new URL(value)
    return ['https:', 'http:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}
