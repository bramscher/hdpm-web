'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'

type Photo = { Url: string; Caption?: string }

/**
 * Listing photo gallery with a full-size lightbox.
 *
 * The grid mirrors the previous server-rendered mosaic (one hero + four
 * thumbnails), but every photo is now clickable and opens a fullscreen
 * viewer that shows the picture as large as the screen allows
 * (object-contain, so nothing is cropped). The viewer supports every
 * photo on the listing — not just the five in the mosaic — with keyboard
 * (←/→/Esc), on-screen arrows, a counter, and captions.
 */
export default function PhotoGallery({
  photos,
  address,
}: {
  photos: Photo[]
  address: string
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const hasPhotos = photos.length > 0
  const total = photos.length

  const activeThumbRef = useRef<HTMLButtonElement | null>(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const next = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i + 1) % total)),
    [total],
  )
  const prev = useCallback(
    () => setOpenIndex((i) => (i === null ? i : (i - 1 + total) % total)),
    [total],
  )

  // Keyboard navigation + body scroll lock while the lightbox is open.
  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
    }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [openIndex, close, next, prev])

  // Keep the active thumbnail visible in the rail as you navigate.
  useEffect(() => {
    if (openIndex === null) return
    activeThumbRef.current?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [openIndex])

  return (
    <>
      {/* Mosaic grid */}
      <section className="bg-primary/5">
        <div className="mx-auto grid max-w-7xl gap-2 p-2 sm:grid-cols-4 sm:grid-rows-2 sm:p-4">
          {/* Main image */}
          <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-gradient-to-br from-primary/20 via-primary/10 to-accent/10 sm:col-span-2 sm:row-span-2">
            {hasPhotos ? (
              <button
                type="button"
                onClick={() => setOpenIndex(0)}
                aria-label="View photo 1 full size"
                className="group absolute inset-0 h-full w-full cursor-zoom-in"
              >
                <Image
                  src={photos[0].Url}
                  alt={photos[0].Caption || `${address} - Main photo`}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  priority
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                />
              </button>
            ) : (
              <div className="flex h-full items-center justify-center">
                <PhotoPlaceholder caption="No photos available" />
              </div>
            )}
          </div>

          {/* Smaller images */}
          {[1, 2, 3, 4].map((i) => {
            const photo = photos[i]
            // Show the "View all" overlay on the last visible thumbnail
            // when there are more photos than the mosaic displays.
            const isLastSlot = i === 4
            const hiddenCount = total - 5
            const showViewAll = isLastSlot && hiddenCount > 0 && !!photo

            return (
              <div
                key={i}
                className="relative hidden aspect-[16/10] overflow-hidden rounded-lg bg-gradient-to-br from-neutral-200 to-neutral-100 sm:block"
              >
                {photo?.Url ? (
                  <button
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label={
                      showViewAll
                        ? `View all ${total} photos`
                        : `View photo ${i + 1} full size`
                    }
                    className="group absolute inset-0 h-full w-full cursor-zoom-in"
                  >
                    <Image
                      src={photo.Url}
                      alt={photo.Caption || `${address} - Photo ${i + 1}`}
                      fill
                      sizes="25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                    {showViewAll && (
                      <span className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-dark/60 font-heading text-white transition-colors group-hover:bg-neutral-dark/70">
                        <span className="text-2xl font-bold leading-none">
                          +{hiddenCount}
                        </span>
                        <span className="mt-1 text-xs font-semibold uppercase tracking-wide">
                          View all
                        </span>
                      </span>
                    )}
                  </button>
                ) : (
                  <div className="flex h-full items-center justify-center text-neutral-mid/40">
                    <CameraIcon />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Mobile "View all photos" button (mosaic thumbnails are hidden on mobile) */}
        {hasPhotos && (
          <div className="px-2 pb-3 sm:hidden">
            <button
              type="button"
              onClick={() => setOpenIndex(0)}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-neutral-200 bg-white py-2.5 font-body text-sm font-semibold text-neutral-dark transition-colors hover:border-accent hover:text-accent"
            >
              <CameraIcon className="h-4 w-4" />
              View all {total} photo{total === 1 ? '' : 's'}
            </button>
          </div>
        )}
      </section>

      {/* Lightbox */}
      {openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${openIndex + 1} of ${total}`}
          className="fixed inset-0 z-[100] flex flex-col bg-neutral-dark/95 backdrop-blur-sm"
          onClick={close}
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 text-white sm:px-6">
            <span className="font-body text-sm tabular-nums text-white/80">
              {openIndex + 1} / {total}
            </span>
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image stage */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden px-2 pb-4 sm:px-16">
            {/* Prev */}
            {total > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  prev()
                }}
                aria-label="Previous photo"
                className="absolute left-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:left-4"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}

            {/* The photo — as large as the stage allows, never cropped */}
            <div
              className="relative h-full w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                key={photos[openIndex].Url}
                src={photos[openIndex].Url}
                alt={photos[openIndex].Caption || `${address} - Photo ${openIndex + 1}`}
                fill
                sizes="100vw"
                priority
                className="object-contain"
              />
            </div>

            {/* Next */}
            {total > 1 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  next()
                }}
                aria-label="Next photo"
                className="absolute right-2 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 sm:right-4"
              >
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
          </div>

          {/* Caption */}
          {photos[openIndex].Caption && (
            <div className="px-4 pb-3 text-center">
              <p className="mx-auto max-w-2xl font-body text-sm text-white/80">
                {photos[openIndex].Caption}
              </p>
            </div>
          )}

          {/* Thumbnail rail — every available photo, jump to any.
              Inner w-max + mx-auto centers the track when it fits and
              scrolls from the start when it overflows (avoids the
              justify-center overflow-clipping bug). */}
          {total > 1 && (
            <div
              className="overflow-x-auto pb-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mx-auto flex w-max gap-2 px-4">
                {photos.map((photo, i) => (
                  <button
                    key={photo.Url}
                    ref={i === openIndex ? activeThumbRef : null}
                    type="button"
                    onClick={() => setOpenIndex(i)}
                    aria-label={`View photo ${i + 1}`}
                    aria-current={i === openIndex}
                    className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-md transition-opacity ${
                      i === openIndex
                        ? 'opacity-100 ring-2 ring-white'
                        : 'opacity-50 hover:opacity-90'
                    }`}
                  >
                    <Image
                      src={photo.Url}
                      alt={photo.Caption || `${address} - Thumbnail ${i + 1}`}
                      fill
                      sizes="80px"
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  )
}

function PhotoPlaceholder({ caption }: { caption?: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-neutral-mid/60">
      <CameraIcon />
      {caption && <span className="text-xs">{caption}</span>}
    </div>
  )
}

function CameraIcon({ className = 'h-10 w-10' }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
      />
    </svg>
  )
}
