'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import { useFormFields } from '@payloadcms/ui'
import type { JobDraft } from '@/lib/job-description'

function plainText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const node = value as { text?: string; root?: unknown; children?: unknown[] }
  if (typeof node.text === 'string') return node.text
  if (node.root) return plainText(node.root)
  return node.children?.map(plainText).join('\n') ?? ''
}

const inputStyle: React.CSSProperties = { width: '100%', padding: 10, border: '1px solid var(--theme-elevation-200)', borderRadius: 4, color: 'var(--theme-text)', background: 'var(--theme-input-bg)', font: 'inherit' }
const buttonStyle: React.CSSProperties = { padding: '10px 16px', borderRadius: 4, border: '1px solid var(--theme-elevation-300)', background: 'var(--theme-elevation-100)', color: 'var(--theme-text)', cursor: 'pointer' }

export default function JobDescriptionCreator() {
  const fields = useFormFields(([fields]) => fields)
  const current = {
    title: fields.title?.value, summary: fields.summary?.value, description: fields.description?.value,
    location: fields.location?.value, schedule: fields.schedule?.value, compensation: fields.compensation?.value,
  }
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [questions, setQuestions] = useState<string[]>([])
  const [answers, setAnswers] = useState<string[]>([])
  const [draft, setDraft] = useState<JobDraft | null>(null)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const inFlight = useRef(false)

  async function request(action: 'questions' | 'generate' | 'save') {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(action)
    setError('')
    try {
      const response = await fetch('/api/job-description', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes, answers: questions.map((question, i) => ({ question, answer: answers[i] || '' })), draft }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Request failed.')
      if (action === 'questions') { setQuestions(data.questions); setAnswers(data.questions.map(() => '')); setDraft(null) }
      if (action === 'generate') setDraft(data.draft)
      if (action === 'save') setSavedId(data.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed. Please try again.')
    } finally { setBusy(''); inFlight.current = false }
  }

  function start() {
    if (!open && !notes) setNotes(Object.entries(current).map(([label, value]) => {
      const text = label === 'description' ? plainText(value) : typeof value === 'string' ? value : ''
      return text ? `${label}: ${text}` : ''
    }).filter(Boolean).join('\n\n').slice(0, 16000))
    setOpen(!open)
  }

  return (
    <section style={{ border: '1px solid var(--theme-elevation-200)', borderRadius: 8, padding: 20, marginBottom: 24 }}>
      <h3 style={{ marginTop: 0 }}>Job Description Creator</h3>
      <p>Turn job notes into a draft with HDPM’s company information. Answer a few questions, review the copy, then save a new draft job.</p>
      <button type="button" style={buttonStyle} onClick={start} aria-expanded={open}>{open ? 'Hide creator' : 'Open creator'}</button>
      {open && <div style={{ marginTop: 20 }}>
        {savedId ? <div role="status">
          <p>Your new draft job is saved. The original listing has not changed.</p>
          <Link href={`/admin/collections/jobs/${savedId}`}>Open saved draft to review and publish →</Link>
        </div> : <>
          <fieldset disabled={Boolean(busy)} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }}>
            <label htmlFor="job-creator-notes">Starting job description or notes</label>
            <textarea id="job-creator-notes" style={inputStyle} rows={8} maxLength={16000} value={notes} onChange={event => { setNotes(event.target.value); setQuestions([]); setAnswers([]); setDraft(null) }} />
            <p>Include what you know. Unconfirmed details can be left blank.</p>
            <button type="button" style={buttonStyle} disabled={!notes.trim() || Boolean(busy)} onClick={() => request('questions')}>{busy === 'questions' ? 'Preparing questions…' : questions.length ? 'Refresh questions' : 'Ask follow-up questions'}</button>
            {questions.length > 0 && <div style={{ marginTop: 24 }}>
              <h4>Tell us more about the role</h4>
              {questions.map((question, index) => <div key={index} style={{ marginBottom: 16 }}>
                <label htmlFor={`job-answer-${index}`}>{question}</label>
                <textarea id={`job-answer-${index}`} style={inputStyle} rows={2} maxLength={2000} value={answers[index] || ''} onChange={event => { setAnswers(previous => previous.map((answer, i) => i === index ? event.target.value : answer)); setDraft(null) }} />
              </div>)}
              <button type="button" style={buttonStyle} onClick={() => request('generate')}>{busy === 'generate' ? 'Writing draft…' : 'Generate draft'}</button>
            </div>}
            {draft && <div style={{ marginTop: 24 }}>
              <h4>Review your draft</h4>
              {draft.reviewNotes.length > 0 && <aside style={{ padding: 12, background: 'var(--theme-elevation-100)', marginBottom: 16 }}>
                <strong>Details to confirm before publishing</strong>
                <ul>{draft.reviewNotes.map((note, index) => <li key={index}>{note}</li>)}</ul>
                <p>These notes are for your review and will not appear in the job description.</p>
              </aside>}
              {(['title', 'summary', 'location', 'schedule', 'compensation', 'description'] as const).map(field => <div key={field} style={{ marginBottom: 16 }}>
                <label htmlFor={`job-draft-${field}`} style={{ textTransform: 'capitalize' }}>{field}</label>
                <textarea id={`job-draft-${field}`} style={inputStyle} rows={field === 'description' ? 18 : field === 'summary' ? 3 : 1} value={draft[field]} maxLength={field === 'description' ? 20000 : field === 'title' ? 200 : field === 'summary' ? 1200 : field === 'location' ? 300 : 500} onChange={event => setDraft({ ...draft, [field]: event.target.value })} />
              </div>)}
              <p>Save creates a separate job with Draft status. Review its contact email and publishing settings in the editor before opening the position.</p>
              <button type="button" style={buttonStyle} disabled={!draft.title.trim() || !draft.summary.trim() || !draft.description.trim()} onClick={() => request('save')}>{busy === 'save' ? 'Saving…' : 'Save as new draft job'}</button>
            </div>}
          </fieldset>
          <p role="status" aria-live="polite">{busy ? 'Working… You can keep this page open while the assistant finishes.' : ''}</p>
          {error && <p role="alert" style={{ color: 'var(--theme-error-500)' }}>{error}</p>}
        </>}
      </div>}
    </section>
  )
}
