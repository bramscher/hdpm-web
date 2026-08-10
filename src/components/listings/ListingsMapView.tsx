'use client'

import dynamic from 'next/dynamic'

// Leaflet touches `window` at import time — client-only, no SSR.
const ListingsMap = dynamic(() => import('./ListingsMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-[560px] w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
      <span className="text-sm font-semibold text-neutral-dark">Loading map…</span>
    </div>
  ),
})

export default function ListingsMapView() {
  return <ListingsMap />
}
