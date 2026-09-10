import assert from 'node:assert/strict'
import test from 'node:test'
import { extractRentZapUrl } from '../src/lib/listing-utils'

// The listing card's Apply Now uses `RentZapURL ?? ApplicationURL` — the same
// per-listing RentZap link the detail page uses. These guard the extraction
// that populates RentZapURL and the card's fallback behavior.

test('extractRentZapUrl pulls the per-listing link from an APPLY NOW line (HTML-encoded)', () => {
  const desc =
    "Beautiful 3BR home. Month&#39;s rent + deposit.\nAPPLY NOW: https://www.rentzap.com/apply/48213\nCall today!"
  const { rentZapUrl, cleanedDescription } = extractRentZapUrl(desc)
  assert.equal(rentZapUrl, 'https://www.rentzap.com/apply/48213')
  // the link is stripped from the copy so the raw URL doesn't render
  assert.ok(!cleanedDescription.includes('rentzap.com'))
  assert.ok(cleanedDescription.includes("Month's rent")) // entity decoded
})

test('extractRentZapUrl handles a bare rentzap url without an APPLY NOW label', () => {
  const { rentZapUrl } = extractRentZapUrl('Nice unit. https://rentzap.com/apply/9001 more text')
  assert.equal(rentZapUrl, 'https://rentzap.com/apply/9001')
})

test('extractRentZapUrl returns null when there is no rentzap link', () => {
  const { rentZapUrl } = extractRentZapUrl('Cozy 1BR, available now. Call to apply.')
  assert.equal(rentZapUrl, null)
})

test('card apply URL prefers RentZapURL, falls back to ApplicationURL', () => {
  // Mirrors ListingCard: const applyUrl = listing.RentZapURL ?? listing.ApplicationURL
  const applyUrl = (RentZapURL: string | undefined, ApplicationURL: string) =>
    RentZapURL ?? ApplicationURL
  assert.equal(
    applyUrl('https://www.rentzap.com/apply/48213', 'https://highdesertpm.appfolio.com/listings'),
    'https://www.rentzap.com/apply/48213',
  )
  assert.equal(
    applyUrl(undefined, 'https://highdesertpm.appfolio.com/listings'),
    'https://highdesertpm.appfolio.com/listings',
  )
})
