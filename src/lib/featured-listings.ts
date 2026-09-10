import type { AppFolioListing } from '@/lib/appfolio'

export const FEATURED_COUNT = 3

export function hasGoodPhoto(l: AppFolioListing): boolean {
  return Array.isArray(l.UnitPhotos) && l.UnitPhotos.length > 0 && !!l.UnitPhotos[0]?.Url
}

// Owner request: never feature the Madras "C Street" property.
export function isExcluded(l: AppFolioListing): boolean {
  const city = (l.City || '').trim().toLowerCase()
  return city === 'madras' && /\bc\s+st(\.|reet)?\b/i.test(l.Address1 || '')
}

/**
 * Curate the homepage feature set to show HDPM's range: the single most
 * expensive rental plus homes from the lowest price quartile (the most
 * affordable), preferring listings that have real photos. Falls back
 * gracefully when inventory is thin, and never returns the excluded property.
 */
export function selectFeatured(
  all: AppFolioListing[],
  count: number = FEATURED_COUNT,
): AppFolioListing[] {
  const eligible = all.filter(
    (l) => !isExcluded(l) && typeof l.AdvertisedRent === 'number' && l.AdvertisedRent > 0,
  )
  if (eligible.length === 0) return []

  // Prefer photographed listings, but don't drop below a full row for it.
  const withPhoto = eligible.filter(hasGoodPhoto)
  const pool = withPhoto.length >= count ? withPhoto : eligible

  const byPriceDesc = [...pool].sort((a, b) => b.AdvertisedRent - a.AdvertisedRent)
  const byPriceAsc = [...byPriceDesc].reverse()

  // Lowest quartile of prices (at least one).
  const quartileSize = Math.max(1, Math.ceil(pool.length / 4))
  const lowerQuartile = byPriceAsc.slice(0, quartileSize)

  const picked: AppFolioListing[] = []
  const seen = new Set<string>()
  const add = (l?: AppFolioListing) => {
    if (l && !seen.has(l.Id) && picked.length < count) {
      seen.add(l.Id)
      picked.push(l)
    }
  }

  add(byPriceDesc[0]) // the most expensive
  lowerQuartile.forEach(add) // fill from the most affordable
  byPriceDesc.forEach(add) // backfill if inventory is tiny

  return picked
}
