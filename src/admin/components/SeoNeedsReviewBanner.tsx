'use client'

import React, { useEffect, useState } from 'react'

/**
 * Renders above the SEO Suggestions list table (`admin.components.beforeListTable`).
 *
 * The collection is the full audit log — it deliberately keeps applied/rejected
 * rows because the SEO agent measures each applied suggestion's outcome ~4 weeks
 * later. This banner surfaces the subset that still needs a human decision
 * (status = pending) with a live count and a one-click filtered view, without
 * hiding the history. "Show all" clears the filter.
 *
 * The pending count is fetched client-side from the Payload REST API using the
 * admin's own session cookie (same-origin), so it always reflects live state.
 */

// Payload's list view parses `where` from the query string; this nested
// or/and shape is what the Filters UI itself emits, so the filter pill shows up
// populated rather than as an opaque query.
const PENDING_QUERY = 'where[or][0][and][0][status][equals]=pending'

export default function SeoNeedsReviewBanner() {
  const [count, setCount] = useState<number | null>(null)
  const [isFiltered, setIsFiltered] = useState(false)

  useEffect(() => {
    setIsFiltered(window.location.search.includes('[status][equals]=pending'))

    // limit=1 (not 0 — in Payload REST limit=0 means "no limit" and would fetch
    // every pending doc); totalDocs still reflects the full filtered count.
    let cancelled = false
    fetch(`/api/seo-suggestions?${PENDING_QUERY}&limit=1&depth=0`, {
      credentials: 'include',
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.totalDocs === 'number') {
          setCount(data.totalDocs)
        }
      })
      .catch(() => {
        /* non-fatal: the list still renders, just without the count */
      })
    return () => {
      cancelled = true
    }
  }, [])

  // Base path of the current list view (robust to a custom admin route).
  const base =
    typeof window !== 'undefined'
      ? window.location.pathname
      : '/admin/collections/seo-suggestions'

  // Nothing pending and not currently filtered → an unobtrusive "all caught up".
  const allCaughtUp = count === 0 && !isFiltered

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        flexWrap: 'wrap',
        padding: '0.75rem 1rem',
        marginBottom: 'var(--base)',
        borderRadius: '4px',
        border: '1px solid var(--theme-elevation-150)',
        background: allCaughtUp ? 'var(--theme-elevation-50)' : 'var(--theme-elevation-100)',
      }}
    >
      {allCaughtUp ? (
        <span style={{ color: 'var(--theme-success-500)', fontWeight: 600 }}>
          ✓ All caught up — no suggestions need review
        </span>
      ) : (
        <>
          <a
            href={`${base}?${PENDING_QUERY}`}
            className="btn btn--style-primary btn--size-small"
            style={{ margin: 0, textDecoration: 'none' }}
          >
            ⚠{' '}
            {count === null
              ? 'Show items that need review'
              : `${count} need review`}
          </a>
          <a
            href={base}
            className="btn btn--style-secondary btn--size-small"
            style={{ margin: 0, textDecoration: 'none' }}
          >
            Show all
          </a>
          <span style={{ color: 'var(--theme-elevation-400)', fontSize: '0.8rem' }}>
            Only “Pending review” items need action — applied &amp; rejected rows are kept as
            history.
          </span>
        </>
      )}
    </div>
  )
}
