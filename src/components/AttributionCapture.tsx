'use client'

import { useEffect } from 'react'
import { captureAttribution } from '@/lib/attribution'

// Records first-touch UTM/referrer data for the session so lead forms can
// attach it on submit. Renders nothing.
export default function AttributionCapture() {
  useEffect(() => {
    captureAttribution()
  }, [])
  return null
}
