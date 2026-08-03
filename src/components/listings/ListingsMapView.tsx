'use client'

import dynamic from 'next/dynamic'

// Leaflet touches `window` at import time — client-only, no SSR.
const ListingsMap = dynamic(() => import('./ListingsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] w-full items-center justify-center rounded-2xl border border-gray-200 bg-gray-50">
      <span className="text-sm font-semibold text-neutral-dark">Loading map…</span>
    </div>
  ),
})

export default function ListingsMapView() {
  return <ListingsMap />
}
