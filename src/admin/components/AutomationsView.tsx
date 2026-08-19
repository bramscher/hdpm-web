'use client'

import React, { useState } from 'react'

interface ActionResult {
  status: 'idle' | 'loading' | 'success' | 'error'
  message?: string
  data?: Record<string, unknown>
}

function ActionCard({
  title,
  description,
  buttonLabel,
  icon,
  onRun,
  result,
  children,
}: {
  title: string
  description: string
  buttonLabel: string
  icon: React.ReactNode
  onRun: () => void
  result: ActionResult
  children?: React.ReactNode
}) {
  return (
    <div
      style={{
        background: 'var(--theme-elevation-50, #fff)',
        border: '1px solid var(--theme-elevation-150, #ddd)',
        borderRadius: '8px',
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
        <div
          style={{
            flexShrink: 0,
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'var(--theme-elevation-100, #f5f5f5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--theme-text, #333)',
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <h3
            style={{
              margin: 0,
              fontSize: '16px',
              fontWeight: 600,
              color: 'var(--theme-text, #333)',
            }}
          >
            {title}
          </h3>
          <p
            style={{
              margin: '4px 0 0',
              fontSize: '13px',
              color: 'var(--theme-elevation-500, #666)',
              lineHeight: 1.5,
            }}
          >
            {description}
          </p>
        </div>
      </div>

      {children}

      <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onRun}
          disabled={result.status === 'loading'}
          style={{
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
            border: 'none',
            borderRadius: '6px',
            cursor: result.status === 'loading' ? 'not-allowed' : 'pointer',
            background: 'var(--theme-success-500, #28a745)',
            color: '#fff',
            opacity: result.status === 'loading' ? 0.6 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {result.status === 'loading' ? 'Running...' : buttonLabel}
        </button>

        {result.status === 'success' && (
          <span style={{ fontSize: '13px', color: 'var(--theme-success-500, #28a745)' }}>
            {result.message}
          </span>
        )}
        {result.status === 'error' && (
          <span style={{ fontSize: '13px', color: 'var(--theme-error-500, #dc3545)' }}>
            {result.message}
          </span>
        )}
      </div>

      {result.data && (
        <pre
          style={{
            marginTop: '12px',
            padding: '12px',
            fontSize: '12px',
            borderRadius: '6px',
            background: 'var(--theme-elevation-100, #f5f5f5)',
            overflow: 'auto',
            maxHeight: '200px',
            lineHeight: 1.5,
          }}
        >
          {JSON.stringify(result.data, null, 2)}
        </pre>
      )}
    </div>
  )
}

function TopicCard({
  topic,
  onCreatePost,
  creating,
  created,
}: {
  topic: { title: string; angle: string; audience: string; source: string; sourceUrl?: string; upvotes?: number; comments?: number }
  onCreatePost: () => void
  creating?: boolean
  created?: { id: number; slug: string; adminUrl: string } | null
}) {
  const audienceColors: Record<string, string> = {
    owners: '#2563eb',
    tenants: '#059669',
    both: '#7c3aed',
  }

  return (
    <div
      style={{
        padding: '12px 16px',
        borderRadius: '6px',
        background: 'var(--theme-elevation-50, #fff)',
        border: '1px solid var(--theme-elevation-150, #ddd)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          {topic.sourceUrl ? (
            <a
              href={topic.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '14px', fontWeight: 600, color: 'var(--theme-text, #333)', textDecoration: 'none' }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
            >
              {topic.title}
            </a>
          ) : (
            <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: 'var(--theme-text, #333)' }}>
              {topic.title}
            </p>
          )}
          <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'var(--theme-elevation-500, #666)', lineHeight: 1.4 }}>
            {topic.angle}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '9999px',
              background: `${audienceColors[topic.audience] || '#666'}15`,
              color: audienceColors[topic.audience] || '#666',
            }}
          >
            {topic.audience}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--theme-elevation-400, #999)' }}>
            {topic.source}
          </span>
        </div>
      </div>
      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        {(topic.upvotes != null || topic.comments != null) && (
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--theme-elevation-400, #999)', flex: 1 }}>
            {topic.upvotes != null && <span>{topic.upvotes} upvotes</span>}
            {topic.comments != null && <span>{topic.comments} comments</span>}
          </div>
        )}
        <div style={{ marginLeft: 'auto' }}>
          {created ? (
            <a
              href={created.adminUrl}
              style={{
                fontSize: '12px',
                fontWeight: 600,
                color: 'var(--theme-success-500, #28a745)',
                textDecoration: 'none',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.textDecoration = 'underline' }}
              onMouseLeave={(e) => { e.currentTarget.style.textDecoration = 'none' }}
            >
              Draft created — Edit post
            </a>
          ) : (
            <button
              onClick={onCreatePost}
              disabled={creating}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                fontWeight: 600,
                border: '1px solid var(--theme-elevation-250, #ccc)',
                borderRadius: '4px',
                background: creating ? 'var(--theme-elevation-100, #f5f5f5)' : 'var(--theme-elevation-50, #fff)',
                color: creating ? 'var(--theme-elevation-400, #999)' : 'var(--theme-text, #333)',
                cursor: creating ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {creating ? 'Generating...' : 'Create Post'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AutomationsView() {
  const [reviewResult, setReviewResult] = useState<ActionResult>({ status: 'idle' })
  const [reviewDryRun, setReviewDryRun] = useState(true)
  const [listingsResult, setListingsResult] = useState<ActionResult>({ status: 'idle' })
  const [researchResult, setResearchResult] = useState<ActionResult>({ status: 'idle' })
  const [researchFocus, setResearchFocus] = useState<'both' | 'owners' | 'tenants'>('both')
  const [researchTopics, setResearchTopics] = useState<Array<{ title: string; angle: string; audience: string; source: string; sourceUrl?: string; upvotes?: number; comments?: number }>>([])
  const [creatingPosts, setCreatingPosts] = useState<Record<number, boolean>>({})
  const [createdPosts, setCreatedPosts] = useState<Record<number, { id: number; slug: string; adminUrl: string }>>({})
  const [blogAgentResult, setBlogAgentResult] = useState<ActionResult>({ status: 'idle' })

  async function syncReviews() {
    setReviewResult({ status: 'loading' })
    try {
      const url = reviewDryRun ? '/api/sync-reviews?dry=true' : '/api/sync-reviews'
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) {
        setReviewResult({ status: 'error', message: data.error || 'Request failed', data })
      } else {
        setReviewResult({
          status: 'success',
          message: data.message || 'Done',
          data,
        })
      }
    } catch (err) {
      setReviewResult({ status: 'error', message: String(err) })
    }
  }

  async function runBlogResearch() {
    setResearchResult({ status: 'loading' })
    setResearchTopics([])
    try {
      const res = await fetch('/api/automations/blog-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ focus: researchFocus }),
      })
      const data = await res.json()
      if (!res.ok) {
        setResearchResult({ status: 'error', message: data.error || 'Request failed', data })
      } else {
        setResearchTopics(data.topics || [])
        setResearchResult({
          status: 'success',
          message: data.message || 'Done',
          data: { stats: data.stats, searchedAt: data.searchedAt },
        })
      }
    } catch (err) {
      setResearchResult({ status: 'error', message: String(err) })
    }
  }

  async function createPost(index: number) {
    const topic = researchTopics[index]
    if (!topic) return

    setCreatingPosts((prev) => ({ ...prev, [index]: true }))
    try {
      const res = await fetch('/api/automations/generate-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic.title,
          angle: topic.angle,
          audience: topic.audience,
          sourceUrl: topic.sourceUrl,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        alert(`Failed to create post: ${data.error || 'Unknown error'}`)
      } else {
        setCreatedPosts((prev) => ({ ...prev, [index]: data.post }))
      }
    } catch (err) {
      alert(`Failed to create post: ${String(err)}`)
    } finally {
      setCreatingPosts((prev) => ({ ...prev, [index]: false }))
    }
  }

  async function runBlogAgent() {
    setBlogAgentResult({ status: 'loading' })
    try {
      const res = await fetch('/api/automations/blog-agent', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || data.ok === false) {
        setBlogAgentResult({
          status: 'error',
          message: data.error || data.skipped || 'Request failed',
          data,
        })
      } else {
        setBlogAgentResult({
          status: 'success',
          message: data.post ? `Draft created: ${data.post.title}` : 'Done',
          data: { post: data.post, image: data.image, topic: data.topic },
        })
      }
    } catch (err) {
      setBlogAgentResult({ status: 'error', message: String(err) })
    }
  }

  async function syncListings() {
    setListingsResult({ status: 'loading' })
    try {
      const res = await fetch('/api/automations/sync-listings', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) {
        setListingsResult({ status: 'error', message: data.error || 'Request failed', data })
      } else {
        setListingsResult({
          status: 'success',
          message: data.message || `Synced ${data.synced ?? 0} listings`,
          data,
        })
      }
    } catch (err) {
      setListingsResult({ status: 'error', message: String(err) })
    }
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1
          style={{
            margin: 0,
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--theme-text, #333)',
          }}
        >
          Automations
        </h1>
        <p
          style={{
            margin: '8px 0 0',
            fontSize: '14px',
            color: 'var(--theme-elevation-500, #666)',
          }}
        >
          Run manual tasks and sync external data sources.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Google Reviews Sync */}
        <ActionCard
          title="Sync Google Reviews"
          description="Fetch the latest 5-star reviews from Google Places and import them as testimonials. Duplicates are automatically skipped."
          buttonLabel={reviewDryRun ? 'Preview Reviews' : 'Import Reviews'}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
          }
          onRun={syncReviews}
          result={reviewResult}
        >
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '12px',
              fontSize: '13px',
              color: 'var(--theme-elevation-500, #666)',
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={reviewDryRun}
              onChange={(e) => setReviewDryRun(e.target.checked)}
              style={{ accentColor: 'var(--theme-success-500, #28a745)' }}
            />
            Dry run (preview only, don&apos;t import)
          </label>
        </ActionCard>

        {/* Blog Research */}
        <ActionCard
          title="Blog Topic Research"
          description="Search Reddit and other sources to find trending topics that Central Oregon property owners and tenants care about. Generates blog post ideas with audience targeting and content angles."
          buttonLabel={researchResult.status === 'loading' ? 'Searching...' : 'Find Topics'}
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 01-2.25 2.25M16.5 7.5V18a2.25 2.25 0 002.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 002.25 2.25h13.5M6 7.5h3v3H6v-3z" />
            </svg>
          }
          onRun={runBlogResearch}
          result={researchResult}
        >
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <label style={{ fontSize: '13px', color: 'var(--theme-elevation-500, #666)' }}>
              Focus:
            </label>
            {(['both', 'owners', 'tenants'] as const).map((opt) => (
              <label
                key={opt}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '13px',
                  color: 'var(--theme-elevation-500, #666)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="focus"
                  value={opt}
                  checked={researchFocus === opt}
                  onChange={() => setResearchFocus(opt)}
                  style={{ accentColor: 'var(--theme-success-500, #28a745)' }}
                />
                {opt.charAt(0).toUpperCase() + opt.slice(1)}
              </label>
            ))}
          </div>

          {researchTopics.length > 0 && (
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '500px', overflow: 'auto' }}>
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--theme-text, #333)' }}>
                Top {researchTopics.length} Topic Suggestions (sorted by relevance):
              </p>
              {researchTopics.map((topic, i) => (
                <TopicCard
                  key={i}
                  topic={topic}
                  onCreatePost={() => createPost(i)}
                  creating={creatingPosts[i]}
                  created={createdPosts[i]}
                />
              ))}
            </div>
          )}
        </ActionCard>

        {/* Blog Agent — full pipeline */}
        <ActionCard
          title="Blog Agent (full pipeline)"
          description="Runs the complete pipeline the twice-weekly cron uses: research Reddit + web, write a draft with Claude, attach a license-safe featured image, and email the digest with social media copy to the inbox. Takes a few minutes."
          buttonLabel="Run Blog Agent"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          }
          onRun={runBlogAgent}
          result={blogAgentResult}
        />

        {/* Listings Sync */}
        <ActionCard
          title="Sync Listings from AppFolio"
          description="Pull the latest available rental listings and photos from AppFolio and update the local cache. Forces a fresh pull (bypasses the 15-minute cache), so use this if a listing's photo is missing or out of date. This normally runs automatically every 15 minutes via cron."
          buttonLabel="Refresh from AppFolio"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 21v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21m0 0h4.5V3.545M12.75 21h7.5V10.75M2.25 21h1.5m18 0h-18M2.25 9l4.5-1.636M18.75 3l-1.5.545m0 6.205l3 1m1.5.5l-1.5-.5M6.75 7.364V3h-3v18m3-13.636l10.5-3.819" />
            </svg>
          }
          onRun={syncListings}
          result={listingsResult}
        />

        {/* CRM Automations */}
        <ActionCard
          title="Run CRM Automation Cycle"
          description="Check for overdue tasks, escalate stale leads, and trigger follow-up reminders. This normally runs on a schedule."
          buttonLabel="Run Now"
          icon={
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182M21.015 4.382v4.993" />
            </svg>
          }
          onRun={async () => {
            // This will be implemented when CRM cron is ready for manual triggers
          }}
          result={{ status: 'idle' }}
        />
      </div>
    </div>
  )
}
