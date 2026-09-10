import assert from 'node:assert/strict'
import test from 'node:test'
import { selectFeatured, isExcluded } from '../src/lib/featured-listings'
import type { AppFolioListing } from '../src/lib/appfolio'

// Minimal listing factory — only the fields selectFeatured reads matter.
function listing(over: Partial<AppFolioListing> & { Id: string; AdvertisedRent: number }): AppFolioListing {
  return {
    Address1: '100 Example Ave',
    City: 'Bend',
    State: 'OR',
    Zip: '97701',
    Bedrooms: 3,
    Bathrooms: 2,
    SquareFeet: 1500,
    AvailableOn: '2026-10-01',
    MarketingTitle: 'Home',
    MarketingDescription: '',
    UnitPhotos: [{ Url: 'https://img.example/photo.jpg' }],
    UnitAmenities: [],
    ApplicationURL: 'https://example.com/apply',
    CatsAllowed: false,
    DogPolicy: '',
    Deposit: 0,
    ...over,
  } as AppFolioListing
}

test('features the most expensive plus the lowest-priced homes', () => {
  const listings = [
    listing({ Id: 'a', AdvertisedRent: 1200 }),
    listing({ Id: 'b', AdvertisedRent: 5000 }), // most expensive
    listing({ Id: 'c', AdvertisedRent: 1800 }),
    listing({ Id: 'd', AdvertisedRent: 900 }), // cheapest
    listing({ Id: 'e', AdvertisedRent: 3200 }),
    listing({ Id: 'f', AdvertisedRent: 1000 }),
  ]
  const featured = selectFeatured(listings)
  assert.equal(featured.length, 3)
  assert.equal(featured[0].Id, 'b') // most expensive first
  // remaining slots come from the lowest-quartile (cheapest) homes
  assert.ok(featured.some((l) => l.Id === 'd'))
  assert.ok(!featured.some((l) => l.Id === 'e')) // a mid-priced home is not featured
})

test('never features the Madras C Street property, even if it is the most expensive', () => {
  const madrasCSt = listing({
    Id: 'madras',
    AdvertisedRent: 9999,
    City: 'Madras',
    Address1: '639 SW C St',
  })
  const featured = selectFeatured([
    madrasCSt,
    listing({ Id: 'a', AdvertisedRent: 2500 }),
    listing({ Id: 'b', AdvertisedRent: 1100 }),
  ])
  assert.ok(!featured.some((l) => l.Id === 'madras'))
})

test('isExcluded matches Madras C St variants but not similar names', () => {
  assert.equal(isExcluded(listing({ Id: '1', AdvertisedRent: 1, City: 'Madras', Address1: '123 C St' })), true)
  assert.equal(isExcluded(listing({ Id: '2', AdvertisedRent: 1, City: 'Madras', Address1: '55 NW C Street' })), true)
  // same street name but a different city is fine
  assert.equal(isExcluded(listing({ Id: '3', AdvertisedRent: 1, City: 'Bend', Address1: '123 C St' })), false)
  // "Century St" must not match the bare-"C" rule
  assert.equal(isExcluded(listing({ Id: '4', AdvertisedRent: 1, City: 'Madras', Address1: '200 Century St' })), false)
})

test('prefers listings that have photos when enough are available', () => {
  const listings = [
    listing({ Id: 'nophoto-top', AdvertisedRent: 9000, UnitPhotos: [] }),
    listing({ Id: 'photo-top', AdvertisedRent: 4000 }),
    listing({ Id: 'photo-cheap1', AdvertisedRent: 1000 }),
    listing({ Id: 'photo-cheap2', AdvertisedRent: 1100 }),
    listing({ Id: 'photo-mid', AdvertisedRent: 2500 }),
  ]
  const featured = selectFeatured(listings)
  assert.ok(!featured.some((l) => l.Id === 'nophoto-top'))
  assert.equal(featured[0].Id, 'photo-top')
})

test('returns empty when there are no eligible listings', () => {
  assert.deepEqual(selectFeatured([]), [])
  assert.deepEqual(
    selectFeatured([listing({ Id: 'x', AdvertisedRent: 0 })]),
    [],
  )
})
