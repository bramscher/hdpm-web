'use client'

import React, { useState, useCallback, useRef } from 'react'
import type { SearchResult } from '../../app/api/image-search/route'

export default function ImageBrowser() {
  const [query, setQuery] = useState('Central Oregon')
  const [source, setSource] = useState<'wikimedia' | 'unsplash'>('wikimedia')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState<string | null>(null)
  const [imported, setImported] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [hasUnsplash, setHasUnsplash] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<SearchResult | null>(null)
  const [altText, setAltText] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(
    async (q: string, src: string, p: number) => {
      if (!q.trim()) return
      setLoading(true)
      setError('')
      try {
        const res = await fetch(
          `/api/image-search?q=${encodeURIComponent(q)}&source=${src}&page=${p}`,
        )
        const data = await res.json()
        if (p === 1) {
          setResults(data.results || [])
        } else {
          setResults((prev) => [...prev, ...(data.results || [])])
        }
        setHasUnsplash(data.hasUnsplash)
      } catch {
        setError('Search failed. Please try again.')
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    search(query, source, 1)
  }

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setPage(1)
      search(value, source, 1)
    }, 500)
  }

  const handleImport = async (result: SearchResult) => {
    setImporting(result.id)
    try {
      const res = await fetch('/api/image-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: result.downloadUrl || result.url,
          alt: altText || result.title,
          caption: result.attribution,
          attribution: result.attribution,
          license: result.license,
          sourceUrl: result.source === 'unsplash' ? `https://unsplash.com/photos/${result.id.replace('unsplash-', '')}` : result.url,
          downloadLocation: result.downloadUrl,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setImported((prev) => new Set(prev).add(result.id))
        setPreview(null)
        setAltText('')
      } else {
        setError(data.error || 'Import failed')
      }
    } catch {
      setError('Import failed. Please try again.')
    } finally {
      setImporting(null)
    }
  }

  const loadMore = () => {
    const nextPage = page + 1
    setPage(nextPage)
    search(query, source, nextPage)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
        Image Browser
      </h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Search open-source images and import them directly into your media library.
      </p>

      {/* Search form */}
      <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Search for images..."
          style={{
            flex: 1,
            padding: '10px 14px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px',
          }}
        />
        <select
          value={source}
          onChange={(e) => {
            setSource(e.target.value as 'wikimedia' | 'unsplash')
            setPage(1)
            search(query, e.target.value, 1)
          }}
          style={{
            padding: '10px 14px',
            border: '1px solid #ccc',
            borderRadius: '6px',
            fontSize: '14px',
            background: '#fff',
          }}
        >
          <option value="wikimedia">Wikimedia Commons</option>
          {hasUnsplash && <option value="unsplash">Unsplash</option>}
        </select>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '10px 20px',
            background: '#2c4a29',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </form>

      {error && (
        <div
          style={{
            padding: '12px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '6px',
            marginBottom: '16px',
            color: '#c33',
          }}
        >
          {error}
        </div>
      )}

      {/* Results grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        {results.map((result) => (
          <div
            key={result.id}
            onClick={() => {
              setPreview(result)
              setAltText(result.title)
            }}
            style={{
              border: imported.has(result.id) ? '2px solid #6bab39' : '1px solid #ddd',
              borderRadius: '8px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s, transform 0.2s',
              background: '#fff',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = 'none'
              e.currentTarget.style.transform = 'none'
            }}
          >
            <div style={{ position: 'relative', paddingTop: '66%', background: '#f5f5f5' }}>
              <img
                src={result.thumbnailUrl}
                alt={result.title}
                loading="lazy"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {imported.has(result.id) && (
                <div
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: '#6bab39',
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  Imported
                </div>
              )}
            </div>
            <div style={{ padding: '10px' }}>
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {result.title}
              </div>
              <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                {result.attribution}
              </div>
              <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                {result.license} &middot; {result.width}x{result.height}
              </div>
            </div>
          </div>
        ))}
      </div>

      {results.length > 0 && (
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <button
            onClick={loadMore}
            disabled={loading}
            style={{
              padding: '10px 24px',
              background: '#f5f5f5',
              border: '1px solid #ddd',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
            }}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}

      {/* Preview / Import modal */}
      {preview && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
          onClick={() => setPreview(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '700px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '24px',
            }}
          >
            <img
              src={preview.url}
              alt={preview.title}
              style={{
                width: '100%',
                borderRadius: '8px',
                marginBottom: '16px',
                maxHeight: '400px',
                objectFit: 'contain',
                background: '#f5f5f5',
              }}
            />
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px' }}>
              {preview.title}
            </h3>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '4px' }}>
              By {preview.attribution}
            </div>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '16px' }}>
              {preview.license} &middot; {preview.width}x{preview.height} &middot;{' '}
              {preview.source === 'unsplash' ? 'Unsplash' : 'Wikimedia Commons'}
            </div>

            <label style={{ display: 'block', marginBottom: '12px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>
                Alt Text (required)
              </span>
              <input
                type="text"
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
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
                onClick={() => setPreview(null)}
                style={{
                  padding: '10px 20px',
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleImport(preview)}
                disabled={!altText.trim() || importing === preview.id}
                style={{
                  padding: '10px 20px',
                  background: importing === preview.id ? '#999' : '#2c4a29',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: importing === preview.id ? 'wait' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                {importing === preview.id ? 'Importing...' : 'Import to Media Library'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
