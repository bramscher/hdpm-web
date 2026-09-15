'use client'

/**
 * Fires a Meta Pixel `ViewContent` event once when a content page mounts
 * (blog post or rental listing). Rendered from server components, which can't
 * call the client-only analytics helpers directly.
 */

import { useEffect } from 'react'
import { trackViewContent } from '@/lib/analytics'

export default function TrackView(props: {
  contentName: string
  contentCategory: string
  contentIds?: Array<string | number>
  value?: number
  currency?: string
}) {
  useEffect(() => {
    trackViewContent(props)
    // Fire once per mount; props are stable for a given page render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return null
}
