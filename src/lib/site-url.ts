// Single source of truth for the site's public origin. The trim() guards
// against stray whitespace/newlines in the env var, which previously broke
// robots.txt, sitemap URLs, and canonical tags.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.highdesertpm.com'
)
  .trim()
  .replace(/\/+$/, '')
