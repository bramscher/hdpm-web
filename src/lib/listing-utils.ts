import type { AppFolioListing } from './appfolio'

/**
 * AppFolio's `DogPolicy` is a free-text field. Whether dogs are allowed is now
 * decided with allow-list semantics: a listing is dog-friendly only when the
 * policy affirmatively says so ("Dogs allowed", "Small dogs allowed"). Anything
 * negative ("Dogs not allowed") or unknown ("Contact for details", blank) is
 * NOT treated as friendly — silence about pets must never read as pets welcome.
 */
const DOG_NEGATIVE = /(no\s+(dogs?|pets?))|((dogs?|pets?)\s+(are\s+)?not\s+(allowed|permitted))|no pets allowed/i
const DOG_AFFIRMATIVE = /allow|permit|welcome/i

export function isDogFriendlyPolicy(policy: string | null | undefined): boolean {
  if (!policy) return false
  if (DOG_NEGATIVE.test(policy)) return false
  return DOG_AFFIRMATIVE.test(policy)
}

export function isListingPetFriendly(listing: Pick<AppFolioListing, 'CatsAllowed' | 'DogPolicy'>): boolean {
  return Boolean(listing.CatsAllowed) || isDogFriendlyPolicy(listing.DogPolicy)
}

/**
 * Resolve a unit-level pet value, falling back to the property-level value when
 * the unit's is blank/null — the same precedence AppFolio's public page uses.
 * Returns a trimmed lowercase string ('' when both are empty).
 */
function resolvePetValue(
  unitValue: string | null | undefined,
  propertyValue: string | null | undefined,
): string {
  const unit = (unitValue ?? '').toString().trim()
  if (unit) return unit.toLowerCase()
  return (propertyValue ?? '').toString().trim().toLowerCase()
}

/**
 * Map AppFolio's v0-API `CatsAllowed` enum ("Yes" | "No" | null | "") to our
 * boolean. Only an explicit "Yes" means cats are allowed — this authoritative
 * signal replaces the fragile detail-page scrape, whose regex misread AppFolio's
 * actual "Cats not allowed" wording as allowed.
 */
export function catsAllowedFromApi(
  unitValue: string | null | undefined,
  propertyValue?: string | null | undefined,
): boolean {
  return resolvePetValue(unitValue, propertyValue) === 'yes'
}

/**
 * Map AppFolio's dog-policy enum to the exact wording AppFolio shows on its
 * public listing page — verified against every current listing. Handles both
 * the `/units` enum ("No"|"Small Only"|"Large & Small"|"Yes") and the
 * `/listings` enum ("Not Allowed"|"Small Only"|"Large & Small"):
 *   "Small Only"          -> "Small dogs allowed"
 *   "Large & Small"|"Yes" -> "Dogs allowed"
 *   "No"|"Not Allowed"    -> "Dogs not allowed"
 *   null | ""             -> "Contact for details"  (unknown — never asserted)
 */
export function dogPolicyFromApi(
  unitValue: string | null | undefined,
  propertyValue?: string | null | undefined,
): string {
  const v = resolvePetValue(unitValue, propertyValue)
  if (!v) return 'Contact for details'
  if (v === 'small only') return 'Small dogs allowed'
  if (v === 'large & small' || v === 'large only' || v === 'yes') return 'Dogs allowed'
  return 'Dogs not allowed' // "no", "not allowed", any other explicit negative
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
 * Pull a YouTube video id out of any of the URL shapes AppFolio emits — the
 * marketing "video" is a link in the detail-page gallery
 * (`youtube.com/watch?v=…`, `youtu.be/…`, or an `youtube.com/embed/…`).
 * Returns the 11-char id or null. Accepts a full URL or a blob of HTML/text.
 */
export function extractYouTubeId(input: string | null | undefined): string | null {
  if (!input) return null
  const m = input.match(
    /(?:youtube\.com\/(?:watch\?(?:[^"'\s]*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/i,
  )
  return m ? m[1] : null
}

/** Privacy-friendly (no-cookie) embed URL for a YouTube video id. */
export function youTubeEmbedUrl(id: string): string {
  return `https://www.youtube-nocookie.com/embed/${id}`
}

/** Canonical watch URL for a YouTube video id. */
export function youTubeWatchUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`
}

/** High-quality thumbnail for a YouTube video id. */
export function youTubeThumb(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`
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
