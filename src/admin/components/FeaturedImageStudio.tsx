'use client'

/**
 * In-draft Featured Image Studio.
 *
 * Rendered as a `ui` field directly beneath the standard `featuredImage` upload
 * field on the Posts editor. It lets an editor find and set a featured image
 * without leaving the draft:
 *   - "Search the web"   — Unsplash + Wikimedia (license-safe), preview + alt,
 *                          one click imports to Media AND sets it on this post.
 *   - "Media library"    — search already-owned photos (curated Central Oregon /
 *                          local uploads) and reuse one with no re-download.
 *
 * Selecting an image calls setValue on the `featuredImage` field, so the native
 * upload field above updates immediately; the editor still presses Save to
 * persist (keeps draft/undo semantics intact). No image is ever auto-applied.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'
import type { SearchResult } from '@/lib/image-search'

const BRAND = '#2c4a29'
const ACCENT = '#6bab39'

// Stopwords stripped when deriving a default web-search query from the post
// title (mirrors the blog-agent's imageQueryForPost heuristic).
const FILLER = new Set([
  'how', 'to', 'what', 'look', 'for', 'a', 'an', 'the', 'your', 'you', 'guide',
  'complete', 'ways', 'tips', 'tip', 'best', 'of', 'and', 'in', 'on', 'with',
  'should', 'know', 'everything', 'about', 'why', 'when', 'choose', 'choosing',
  'need', 'this', 'that', 'from', 'into', 'out',
])

function queryFromTitle(title: string): string {
  if (/upgrade|renovat|kitchen|remodel/i.test(title)) return 'modern kitchen interior'
  if (/maintenance|repair/i.test(title)) return 'home maintenance repair'
  if (/moving|move.in/i.test(title)) return 'moving boxes home'
  if (/lease|screening|landlord|self.manage|property manag/i.test(title)) return 'rental home keys'
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !FILLER.has(w))
  return words.slice(0, 3).join(' ').trim()
}

interface LibraryImage {
  id: number
  url: string
  thumbnailUrl: string
  alt: string
  attribution: string
  width: number
  height: number
  filename: string
}

type Tab = 'web' | 'library'

export default function FeaturedImageStudio() {
  // Bind to the sibling upload field so selecting here updates the native field.
  const { value: featuredImage, setValue: setFeaturedImage } = useField<
    number | null | undefined
  >({ path: 'featuredImage' })
  const title = useFormFields(([fields]) => (fields?.title?.value as string) || '')

  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('web')
  const [query, setQuery] = useState('')
  const [source, setSource] = useState<'unsplash' | 'wikimedia'>('unsplash')
  const [hasUnsplash, setHasUnsplash] = useState(true)

  const [webResults, setWebResults] = useState<SearchResult[]>([])
  const [libResults, setLibResults] = useState<LibraryImage[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')

  const [preview, setPreview] = useState<SearchResult | null>(null)
  const [altText, setAltText] = useState('')
  const [busyId, setBusyId] = useState<string | number | null>(null)
  const seededRef = useRef(false)

  // Seed the search box from the post title the first time the studio opens.
  useEffect(() => {
    if (open && !seededRef.current) {
      seededRef.current = true
      const seeded = queryFromTitle(title) || 'Central Oregon home exterior'
      setQuery(seeded)
    }
  }, [open, title])

  const searchWeb = useCallback(
    async (q: string, src: string, p: number) => {
      if (!q.trim()) return
      setLoading(true)
      setSearched(true)
      setError('')
      try {
        const res = await fetch(
          `/api/image-search?q=${encodeURIComponent(q)}&source=${src}&page=${p}`,
        )
        const data = await res.json()
        setHasUnsplash(data.hasUnsplash !== false)
        if (data.hasUnsplash === false) setSource('wikimedia')
        if (!res.ok) throw new Error(data.error || 'Image search failed.')
        setWebResults((prev) =>
          p === 1 ? data.results || [] : [...prev, ...(data.results || [])],
        )
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const searchLibrary = useCallback(async (q: string) => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/media-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Library search failed.')
      setLibResults(data.results || [])
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Library search failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  const runSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    setPage(1)
    if (tab === 'web') searchWeb(query, source, 1)
    else searchLibrary(query)
  }

  const switchTab = (next: Tab) => {
    setTab(next)
    setError('')
    setStatus('')
    if (next === 'library' && libResults.length === 0) searchLibrary(query)
    if (next === 'web' && webResults.length === 0) searchWeb(query, source, 1)
  }

  // Import an external result into Media, then set it as the featured image.
  const useWebImage = async (result: SearchResult) => {
    if (!altText.trim()) return
    setBusyId(result.id)
    setError('')
    try {
      const res = await fetch('/api/image-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.url,
          alt: altText,
          caption: result.attribution,
          attribution: result.attribution,
          license: result.license,
          sourceUrl:
            result.source === 'unsplash'
              ? `https://unsplash.com/photos/${result.id.replace('unsplash-', '')}`
              : result.url,
          downloadLocation: result.downloadUrl,
        }),
      })
      const data = await res.json()
      if (data.success && data.id) {
        setFeaturedImage(data.id)
        setPreview(null)
        setAltText('')
        setStatus('✓ Set as featured image — press Save to keep it.')
      } else {
        setError(data.error || 'Import failed')
      }
    } catch {
      setError('Import failed. Please try again.')
    } finally {
      setBusyId(null)
    }
  }

  // Reuse an owned Media image — no download needed.
  const useLibraryImage = (img: LibraryImage) => {
    setFeaturedImage(img.id)
    setStatus('✓ Set as featured image — press Save to keep it.')
  }

  if (!open) {
    return (
      <div style={{ margin: '4px 0 20px' }}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: '8px 16px',
            background: BRAND,
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {featuredImage ? '↺ Find a different image' : '🔍 Find a featured image'}
        </button>
        {status && (
          <span style={{ marginLeft: '12px', color: ACCENT, fontSize: '13px', fontWeight: 600 }}>
            {status}
          </span>
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        margin: '4px 0 24px',
        border: `1px solid #ddd`,
        borderRadius: '10px',
        overflow: 'hidden',
        background: '#fafafa',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#fff',
          borderBottom: '1px solid #eee',
        }}
      >
        <div>
          <strong style={{ fontSize: '14px' }}>Featured Image Studio</strong>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Search the web or reuse an owned photo, then set it on this post.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setOpen(false)}
          style={{
            padding: '6px 12px',
            background: '#f2f2f2',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>

      <div style={{ padding: '16px' }}>
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
          {(['web', 'library'] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => switchTab(t)}
              style={{
                padding: '6px 14px',
                borderRadius: '6px',
                border: '1px solid ' + (tab === t ? BRAND : '#ddd'),
                background: tab === t ? BRAND : '#fff',
                color: tab === t ? '#fff' : '#333',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {t === 'web' ? 'Search the web' : 'Media library'}
            </button>
          ))}
        </div>

        {/* Search form */}
        <div role="search" aria-label="Featured image search" style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
          <input
            type="text"
            aria-label="Image search terms"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                event.stopPropagation()
                runSearch()
              }
            }}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              tab === 'web'
                ? 'e.g. modern home exterior Bend Oregon'
                : 'Search your media library…'
            }
            style={{
              flex: 1,
              padding: '9px 12px',
              border: '1px solid #ccc',
              borderRadius: '6px',
              fontSize: '13px',
            }}
          />
          {tab === 'web' && (
            <select
              value={source}
              onChange={(e) => {
                const src = e.target.value as 'unsplash' | 'wikimedia'
                setSource(src)
                setPage(1)
                searchWeb(query, src, 1)
              }}
              style={{
                padding: '9px 12px',
                border: '1px solid #ccc',
                borderRadius: '6px',
                fontSize: '13px',
                background: '#fff',
              }}
            >
              {hasUnsplash && <option value="unsplash">Unsplash</option>}
              <option value="wikimedia">Wikimedia</option>
            </select>
          )}
          <button
            type="button"
            onClick={() => runSearch()}
            disabled={loading}
            style={{
              padding: '9px 18px',
              background: BRAND,
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>

        {error && (
          <div
            style={{
              padding: '10px',
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '6px',
              marginBottom: '12px',
              color: '#c33',
              fontSize: '13px',
            }}
          >
            {error}
          </div>
        )}
        {status && (
          <div
            style={{
              padding: '10px',
              background: '#eef7e8',
              border: `1px solid ${ACCENT}`,
              borderRadius: '6px',
              marginBottom: '12px',
              color: BRAND,
              fontSize: '13px',
              fontWeight: 600,
            }}
          >
            {status}
          </div>
        )}

        {/* Results grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
            gap: '12px',
          }}
        >
          {tab === 'web'
            ? webResults.map((r) => (
                <ResultTile
                  key={r.id}
                  thumb={r.thumbnailUrl}
                  title={r.title}
                  subtitle={`${r.attribution}`}
                  meta={`${r.license} · ${r.width}×${r.height}`}
                  selected={false}
                  onClick={() => {
                    setPreview(r)
                    setAltText(r.title && r.title !== 'Untitled' ? r.title : title)
                  }}
                />
              ))
            : libResults.map((img) => (
                <ResultTile
                  key={img.id}
                  thumb={img.thumbnailUrl}
                  title={img.alt || img.filename}
                  subtitle={img.attribution}
                  meta={img.width ? `${img.width}×${img.height}` : ''}
                  selected={featuredImage === img.id}
                  busy={busyId === img.id}
                  onClick={() => useLibraryImage(img)}
                />
              ))}
        </div>

        {tab === 'web' && webResults.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: '14px' }}>
            <button
              type="button"
              onClick={() => {
                const next = page + 1
                setPage(next)
                searchWeb(query, source, next)
              }}
              disabled={loading}
              style={{
                padding: '8px 20px',
                background: '#f2f2f2',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              {loading ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}

        {!loading && !error &&
          ((tab === 'web' && webResults.length === 0) ||
            (tab === 'library' && libResults.length === 0)) && (
            <div style={{ padding: '24px', textAlign: 'center', color: '#999', fontSize: '13px' }}>
              {tab === 'library'
                ? 'No matching images in your library yet.'
                : searched ? 'No images matched. Try a short subject such as “modern kitchen” or choose another source.' : 'Search to see results.'}
            </div>
          )}
      </div>

      {/* Web preview / confirm modal */}
      {preview && (
        <div
          onClick={() => setPreview(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '680px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '24px',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.url}
              alt={preview.title}
              style={{
                width: '100%',
                borderRadius: '8px',
                marginBottom: '16px',
                maxHeight: '380px',
                objectFit: 'contain',
                background: '#f5f5f5',
              }}
            />
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
              By {preview.attribution}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              {preview.license} · {preview.width}×{preview.height} ·{' '}
              {preview.source === 'unsplash' ? 'Unsplash' : 'Wikimedia Commons'}
            </div>
            <label style={{ display: 'block', marginBottom: '16px' }}>
              <span
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '4px',
                }}
              >
                Alt text (required)
              </span>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Describe the image for accessibility & SEO"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  fontSize: '14px',
                  boxSizing: 'border-box',
                }}
              />
            </label>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setPreview(null)}
                style={{
                  padding: '10px 18px',
                  background: '#f2f2f2',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => useWebImage(preview)}
                disabled={!altText.trim() || busyId === preview.id}
                style={{
                  padding: '10px 18px',
                  background: busyId === preview.id || !altText.trim() ? '#999' : BRAND,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: busyId === preview.id ? 'wait' : 'pointer',
                }}
              >
                {busyId === preview.id ? 'Applying…' : 'Use as featured image'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function ResultTile({
  thumb,
  title,
  subtitle,
  meta,
  selected,
  busy,
  onClick,
}: {
  thumb: string
  title: string
  subtitle?: string
  meta?: string
  selected?: boolean
  busy?: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        border: selected ? `2px solid ${ACCENT}` : '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'hidden',
        cursor: busy ? 'wait' : 'pointer',
        background: '#fff',
        opacity: busy ? 0.6 : 1,
      }}
    >
      <div style={{ position: 'relative', paddingTop: '66%', background: '#f5f5f5' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumb}
          alt={title}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        {selected && (
          <div
            style={{
              position: 'absolute',
              top: '6px',
              right: '6px',
              background: ACCENT,
              color: '#fff',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            Selected
          </div>
        )}
      </div>
      <div style={{ padding: '8px' }}>
        <div
          style={{
            fontSize: '12px',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </div>
        {subtitle && (
          <div
            style={{
              fontSize: '11px',
              color: '#888',
              marginTop: '2px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </div>
        )}
        {meta && <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{meta}</div>}
      </div>
    </div>
  )
}
