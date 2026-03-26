'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useCallback } from 'react'

const CITIES = [
  'All',
  'Bend',
  'Redmond',
  'Sisters',
  'Prineville',
  'La Pine',
  'Madras',
]

const BEDROOMS = [
  { label: 'Any', value: '' },
  { label: '1+', value: '1' },
  { label: '2+', value: '2' },
  { label: '3+', value: '3' },
  { label: '4+', value: '4' },
]

const PRICE_RANGES = [
  { label: 'Any', value: '' },
  { label: 'Under $1,500', value: 'under-1500' },
  { label: '$1,500 - $2,000', value: '1500-2000' },
  { label: '$2,000 - $2,500', value: '2000-2500' },
  { label: '$2,500+', value: '2500-plus' },
]

export function ListingFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const city = searchParams.get('city') || ''
  const beds = searchParams.get('beds') || ''
  const price = searchParams.get('price') || ''
  const pets = searchParams.get('pets') === 'true'

  const hasActiveFilters = city || beds || price || pets

  const updateParams = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      const query = params.toString()
      router.push(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  const clearFilters = useCallback(() => {
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-lg sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-4">
        {/* City */}
        <div className="flex-1">
          <label
            htmlFor="filter-city"
            className="mb-1 block font-body text-xs font-medium text-neutral-mid"
          >
            City
          </label>
          <select
            id="filter-city"
            value={city}
            onChange={(e) => updateParams('city', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-body text-sm text-neutral-dark transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {CITIES.map((c) => (
              <option key={c} value={c === 'All' ? '' : c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Bedrooms */}
        <div className="flex-1">
          <label
            htmlFor="filter-beds"
            className="mb-1 block font-body text-xs font-medium text-neutral-mid"
          >
            Bedrooms
          </label>
          <select
            id="filter-beds"
            value={beds}
            onChange={(e) => updateParams('beds', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-body text-sm text-neutral-dark transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {BEDROOMS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div className="flex-1">
          <label
            htmlFor="filter-price"
            className="mb-1 block font-body text-xs font-medium text-neutral-mid"
          >
            Price Range
          </label>
          <select
            id="filter-price"
            value={price}
            onChange={(e) => updateParams('price', e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 font-body text-sm text-neutral-dark transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            {PRICE_RANGES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>

        {/* Pet-Friendly Toggle */}
        <div className="flex items-center gap-3 sm:pb-0.5">
          <button
            type="button"
            role="switch"
            aria-checked={pets}
            onClick={() => updateParams('pets', pets ? '' : 'true')}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:ring-2 focus:ring-primary/20 focus:outline-none ${
              pets ? 'bg-primary' : 'bg-gray-300'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                pets ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
          <span className="font-body text-sm text-neutral-dark">
            Pet-Friendly
          </span>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="shrink-0 rounded-lg px-4 py-2.5 font-body text-sm font-medium text-primary transition-colors hover:bg-primary/5 focus:ring-2 focus:ring-primary/20 focus:outline-none"
          >
            Clear Filters
          </button>
        )}
      </div>
    </div>
  )
}
