'use client'

import { useState } from 'react'

/**
 * Share bar for listing detail pages. Facebook, X, and email use native
 * share intents with this listing's URL (the page's Open Graph tags make
 * the shared card show the photo, price, and address). Instagram has no
 * web share intent, so its button copies the listing link and opens
 * Instagram in a new tab ready to paste into a post, story, or bio;
 * "Copy link" stays as the catch-all for YouTube, texts, etc.
 */
export default function ShareListing({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false)
  const [igCopied, setIgCopied] = useState(false)
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const iconClass =
    'flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-neutral-dark transition-colors hover:border-accent hover:text-accent'

  return (
    <div className="flex items-center gap-2">
      <span className="mr-1 text-sm font-semibold text-neutral-dark">Share:</span>

      <a
        className={iconClass}
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on Facebook"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      </a>

      <a
        className={iconClass}
        href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Share on X"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </a>

      <button
        className={iconClass}
        onClick={() => {
          // Mobile: the native share sheet lists Instagram (post/story/DM)
          // when the app is installed — the real "share to my Instagram".
          if (typeof navigator.share === 'function') {
            void navigator.share({ title, url }).catch(() => {})
            return
          }
          // Desktop fallback: copy the link and open Instagram to paste.
          void navigator.clipboard.writeText(url).then(() => {
            setIgCopied(true)
            setTimeout(() => setIgCopied(false), 2500)
            window.open('https://www.instagram.com/', '_blank', 'noopener')
          })
        }}
        aria-label="Share on Instagram"
        title="Share this listing on your Instagram"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
      </button>
      {igCopied && (
        <span className="text-xs font-semibold text-accent">Link copied — paste it in Instagram</span>
      )}

      <a
        className={iconClass}
        href={`mailto:?subject=${encodedTitle}&body=${encodeURIComponent(`Check out this rental from High Desert Property Management:\n\n${title}\n${url}`)}`}
        aria-label="Share by email"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
        </svg>
      </a>

      <button
        className={iconClass}
        onClick={() => {
          void navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          })
        }}
        aria-label="Copy link for Instagram, YouTube, or anywhere else"
        title="Copy link (for Instagram, YouTube, texts…)"
      >
        {copied ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
        )}
      </button>
      {copied && <span className="text-xs font-semibold text-accent">Link copied!</span>}
    </div>
  )
}
