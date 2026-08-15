'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Shared input styling, matched to LeadForm so the tools feel native. */
const inputBase =
  'block w-full rounded-lg border border-neutral-300 bg-white text-neutral-dark shadow-sm transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30'

/**
 * Labeled numeric field with an optional leading unit (e.g. "$") or trailing
 * unit (e.g. "%"). Controlled — the parent owns the string value so empty
 * inputs stay empty rather than snapping to 0.
 */
export function Field({
  label,
  value,
  onChange,
  prefix,
  suffix,
  placeholder,
  step,
  min,
  hint,
  id,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  prefix?: string
  suffix?: string
  placeholder?: string
  step?: number
  min?: number
  hint?: string
  id: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-neutral-dark">
        {label}
      </label>
      <div className="relative mt-1.5">
        {prefix && (
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-neutral-mid">
            {prefix}
          </span>
        )}
        <input
          id={id}
          type="number"
          inputMode="decimal"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          step={step}
          min={min}
          className={cn(inputBase, 'py-3', prefix ? 'pl-7' : 'pl-4', suffix ? 'pr-9' : 'pr-4')}
        />
        {suffix && (
          <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-neutral-mid">
            {suffix}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-neutral-mid">{hint}</p>}
    </div>
  )
}

/** Two-option segmented toggle (e.g. Yes / No, Single / Married). */
export function Toggle<T extends string>({
  label,
  value,
  options,
  onChange,
  id,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  id: string
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-neutral-dark">
        {label}
      </label>
      <div id={id} className="mt-1.5 grid grid-flow-col gap-1 rounded-lg border border-neutral-300 bg-neutral-100 p-1">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            aria-pressed={value === opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
              value === opt.value
                ? 'bg-white text-accent-dark shadow-sm'
                : 'text-neutral-mid hover:text-neutral-dark',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** A single headline result stat. `emphasis` gives the primary/hero number. */
export function Stat({
  label,
  value,
  emphasis = false,
  tone = 'default',
}: {
  label: string
  value: string
  emphasis?: boolean
  tone?: 'default' | 'positive' | 'negative'
}) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-white/60">{label}</dt>
      <dd
        className={cn(
          'mt-1 font-heading font-bold tabular-nums',
          emphasis ? 'text-title' : 'text-subtitle',
          tone === 'positive' && 'text-accent-light',
          tone === 'negative' && 'text-red-400',
          tone === 'default' && 'text-white',
        )}
      >
        {value}
      </dd>
    </div>
  )
}

/** Dark results panel that sits beside/under the inputs. */
export function ResultsPanel({
  title,
  children,
  footnote,
}: {
  title: string
  children: ReactNode
  footnote?: ReactNode
}) {
  return (
    <div className="rounded-2xl bg-primary p-6 text-white shadow-lg sm:p-8">
      <h3 className="font-heading text-heading text-white/90">{title}</h3>
      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-5">{children}</dl>
      {footnote && <div className="mt-6 border-t border-white/10 pt-4 text-xs leading-relaxed text-white/50">{footnote}</div>}
    </div>
  )
}

/** Grouping wrapper for a labeled block of inputs. */
export function FieldGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-bold uppercase tracking-wide text-accent-dark">{title}</legend>
      {children}
    </fieldset>
  )
}
