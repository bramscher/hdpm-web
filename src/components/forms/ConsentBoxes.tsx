'use client'

import { EMAIL_CONSENT_TEXT, SMS_CONSENT_TEXT } from '@/lib/crm/consent-wording'

interface ConsentBoxesProps {
  /** Unique per form on the page, used for input ids. */
  idPrefix: string
  /** Controlled mode for forms that post JSON; omit for plain form posts. */
  value?: { sms: boolean; email: boolean }
  onChange?: (value: { sms: boolean; email: boolean }) => void
  dark?: boolean
}

/**
 * Separate SMS and email consent boxes, both unticked by default. Optional:
 * leaving them unticked never blocks the form. Plain form posts send
 * smsConsent=on / emailConsent=on when ticked.
 */
export default function ConsentBoxes({ idPrefix, value, onChange, dark = false }: ConsentBoxesProps) {
  const text = dark ? 'text-white/80' : 'text-neutral-600'
  const box = 'mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-accent focus:ring-accent/30'
  const controlled = value && onChange
  const rows = [
    { key: 'sms' as const, name: 'smsConsent', label: SMS_CONSENT_TEXT },
    { key: 'email' as const, name: 'emailConsent', label: EMAIL_CONSENT_TEXT },
  ]
  return (
    <fieldset className="space-y-3">
      <legend className={`text-sm font-semibold ${dark ? 'text-white' : 'text-neutral-dark'}`}>
        Optional: how we may contact you
      </legend>
      {rows.map((row) => (
        <div key={row.key} className="flex items-start gap-3">
          <input
            type="checkbox"
            id={`${idPrefix}-${row.name}`}
            name={row.name}
            className={box}
            {...(controlled
              ? {
                  checked: value[row.key],
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    onChange({ ...value, [row.key]: e.target.checked }),
                }
              : { defaultChecked: false })}
          />
          <label htmlFor={`${idPrefix}-${row.name}`} className={`text-xs leading-relaxed ${text}`}>
            {row.label}{' '}
            See our{' '}
            <a href="/privacy" className="underline" target="_blank" rel="noopener">
              Privacy Policy
            </a>
            .
          </label>
        </div>
      ))}
    </fieldset>
  )
}
