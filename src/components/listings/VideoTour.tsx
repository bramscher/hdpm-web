'use client'

import { useState } from 'react'
import { extractYouTubeId, youTubeEmbedUrl, youTubeThumb } from '@/lib/listing-utils'

/**
 * Click-to-play YouTube facade for a listing's video tour. Renders the
 * thumbnail + a play button and only loads the (privacy-friendly, no-cookie)
 * iframe once the visitor clicks — no third-party embed weight on page load.
 */
export default function VideoTour({
  url,
  title = 'Property video tour',
}: {
  url: string
  title?: string
}) {
  const [playing, setPlaying] = useState(false)
  const id = extractYouTubeId(url)
  if (!id) return null

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-neutral-900 shadow-sm">
      {playing ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`${youTubeEmbedUrl(id)}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          className="group absolute inset-0 h-full w-full cursor-pointer"
          aria-label={`Play ${title}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youTubeThumb(id)}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 motion-reduce:transform-none"
            loading="lazy"
          />
          <span className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/30" />
          <span className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
            <svg aria-hidden="true" className="h-7 w-7 translate-x-0.5 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </button>
      )}
    </div>
  )
}
