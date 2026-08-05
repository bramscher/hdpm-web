'use client'

import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapListing {
  id: string
  lat: number
  lng: number
  title: string
  address: string
  city: string
  rent: number
  beds: number
  baths: number
  photo: string | null
  available: string
}

/**
 * Leaflet map of all current listings across Central Oregon, with
 * price-tagged pins and listing-card popups. Tiles from OpenStreetMap —
 * no API key required.
 */
export default function ListingsMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(
      [44.15, -121.0], // central Central Oregon
      9,
    )
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    fetch('/api/listings/map')
      .then((r) => r.json())
      .then((data: { listings: MapListing[] }) => {
        const listings = data.listings ?? []
        if (listings.length === 0) {
          setState('empty')
          return
        }

        // Fan out listings that share an address (units in one building) so
        // every pin stays clickable.
        const seen = new Map<string, number>()
        const bounds: L.LatLngTuple[] = []

        for (const l of listings) {
          const key = `${l.lat.toFixed(5)},${l.lng.toFixed(5)}`
          const n = seen.get(key) ?? 0
          seen.set(key, n + 1)
          const angle = (n * 2 * Math.PI) / 3
          const lat = l.lat + (n > 0 ? 0.0006 * Math.sin(angle) : 0)
          const lng = l.lng + (n > 0 ? 0.0009 * Math.cos(angle) : 0)
          bounds.push([lat, lng])

          const icon = L.divIcon({
            className: '',
            html: `<div style="background:#166534;color:#fff;font-weight:700;font-size:12px;padding:4px 8px;border-radius:999px;white-space:nowrap;box-shadow:0 1px 4px rgba(0,0,0,.4);border:2px solid #fff;">$${l.rent.toLocaleString()}</div>`,
            iconSize: [0, 0],
            iconAnchor: [30, 14],
          })

          const marker = L.marker([lat, lng], { icon }).addTo(map)
          marker.bindPopup(
            `<div style="width:210px;font-family:inherit;">
              ${l.photo ? `<img src="${l.photo}" alt="" style="width:100%;height:110px;object-fit:cover;border-radius:8px;" />` : ''}
              <div style="font-weight:700;margin-top:6px;">${l.title}</div>
              <div style="color:#555;font-size:12px;">${l.address}, ${l.city}</div>
              <div style="margin-top:4px;font-size:13px;"><strong>$${l.rent.toLocaleString()}/mo</strong> · ${l.beds} bd / ${l.baths} ba</div>
              <a href="/listings/${l.id}" style="display:inline-block;margin-top:8px;background:#166534;color:#fff;padding:6px 12px;border-radius:8px;font-weight:600;font-size:12px;text-decoration:none;">View listing</a>
            </div>`,
            { maxWidth: 240 },
          )
        }

        if (bounds.length > 0) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 })
        }
        setState('ready')
      })
      .catch(() => setState('error'))

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="h-[560px] w-full overflow-hidden rounded-xl border border-neutral-200 shadow-sm"
      />
      {state === 'loading' && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-dark shadow">
            Loading map…
          </span>
        </div>
      )}
      {state === 'error' && (
        <p className="mt-3 text-sm text-red-700">
          The map couldn&apos;t load — please use the list view.
        </p>
      )}
    </div>
  )
}
