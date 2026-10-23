import { OFFICE, telHref } from '@/lib/agents'

/**
 * "Call the office 9–4 weekdays" line for listing cards and pages, under the
 * Leesa pill: renters who want a person know when to call and the number.
 */
export default function CallOffice({ className = '' }: { className?: string }) {
  return (
    <p className={`text-center font-body text-xs text-neutral-mid ${className}`}>
      Call the office {OFFICE.hours} at{' '}
      <a href={telHref(OFFICE.phone)} className="font-semibold text-neutral-dark underline-offset-2 hover:text-accent hover:underline">
        ({OFFICE.phone.slice(0, 3)}) {OFFICE.phone.slice(4)}
      </a>
    </p>
  )
}
