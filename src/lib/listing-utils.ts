import type { AppFolioListing } from './appfolio'

/**
 * AppFolio's `DogPolicy` is a free-text field. Older code compared against the
 * exact string "No dogs", which let any other phrasing ("Dogs not allowed",
 * "No pets", etc.) leak through as pet-friendly. This negates known forms.
 */
const DOG_NEGATIVE = /(no\s+(dogs?|pets?))|((dogs?|pets?)\s+(are\s+)?not\s+(allowed|permitted))|no pets allowed/i

export function isDogFriendlyPolicy(policy: string | null | undefined): boolean {
  if (!policy) return false
  return !DOG_NEGATIVE.test(policy)
}

export function isListingPetFriendly(listing: Pick<AppFolioListing, 'CatsAllowed' | 'DogPolicy'>): boolean {
  return Boolean(listing.CatsAllowed) || isDogFriendlyPolicy(listing.DogPolicy)
}

/**
 * Property managers paste the unique per-listing RentZap application link into
 * the AppFolio marketing description (usually as "APPLY NOW: <url>"). Pull it
 * out so it can drive the Apply Now button, and return the description with
 * that line removed so the raw URL doesn't show up in the listing copy.
 */
const RENTZAP_URL = /https?:\/\/(?:www\.)?rentzap\.com\/apply\/\d+/i

/**
 * AppFolio's public-page HTML (og:description) arrives HTML-encoded, so text
 * like "Month's" shows up as "Month&#39;s". Decode the common named and numeric
 * entities so the copy reads as plain text. Named-entity decode runs last so a
 * literal "&amp;#39;" resolves to "&#39;" rather than being over-decoded.
 */
const NAMED_ENTITIES: Record<string, string> = {
  '&quot;': '"',
  '&apos;': "'",
  '&lt;': '<',
  '&gt;': '>',
  '&nbsp;': ' ',
  '&amp;': '&',
}

export function decodeHtmlEntities(input: string | null | undefined): string {
  if (!input) return ''
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&(?:quot|apos|lt|gt|nbsp|amp);/g, (m) => NAMED_ENTITIES[m])
}

export function extractRentZapUrl(description: string | null | undefined): {
  rentZapUrl: string | null
  cleanedDescription: string
} {
  const text = decodeHtmlEntities(description)
  const match = text.match(RENTZAP_URL)
  const cleanedDescription = text
    .replace(/\r\n/g, '\n')
    // Drop an "APPLY NOW: <url>" label+link wherever it appears…
    .replace(
      /[^\S\n]*apply\s*now\s*:?[^\S\n]*https?:\/\/(?:www\.)?rentzap\.com\/apply\/\d+/gi,
      '',
    )
    // …then any bare RentZap URL left behind.
    .replace(new RegExp(RENTZAP_URL.source, 'gi'), '')
    // Tidy up whitespace left where the link used to be.
    .replace(/[^\S\n]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return { rentZapUrl: match ? match[0] : null, cleanedDescription }
}

/**
 * AppFolio's `AvailableOn` may be empty, the literal string `"Now"`, or a date
 * string in any of several formats. Render whatever was supplied if it can't
 * parse; show a graceful fallback when nothing was supplied.
 */
export function formatAvailableDate(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return 'Contact for availability'
  const trimmed = raw.trim()
  // AppFolio sometimes sends label strings ("NOW", "Available Now") instead
  // of dates — normalize so callers never render "Available Available Now".
  if (/now/i.test(trimmed) && trimmed.length <= 20) return 'Available Now'
  const d = new Date(trimmed.includes('T') ? trimmed : trimmed + 'T00:00:00')
  if (isNaN(d.getTime())) {
    return /^available/i.test(trimmed) ? trimmed : `Available ${trimmed}`
  }
  if (d.getTime() <= Date.now()) return 'Available Now'
  return `Available ${d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })}`
}
