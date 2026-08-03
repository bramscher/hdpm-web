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
