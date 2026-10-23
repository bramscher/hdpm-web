import { OFFICE, telHref } from '@/lib/agents'

/**
 * "Call the office" button for listing cards and pages: the first way to reach
 * a person (staff answer 9–4 weekdays), above the smaller Leesa AI pill.
 */
export default function CallOffice({ className = '' }: { className?: string }) {
  const display = `(${OFFICE.phone.slice(0, 3)}) ${OFFICE.phone.slice(4)}`
  return (
    <a
      href={telHref(OFFICE.phone)}
      aria-label={`Call the office at ${display}, staff available ${OFFICE.hours}`}
      className={`group flex w-full items-center gap-3 rounded-lg border-2 border-accent bg-accent/5 px-4 py-2.5 transition-colors hover:bg-accent hover:text-white ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-white group-hover:bg-white group-hover:text-accent">
        <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
          />
        </svg>
      </span>
      <span className="flex min-w-0 flex-col text-left leading-tight">
        <span className="font-heading text-sm font-bold text-neutral-dark group-hover:text-white">
          Call the office · {display}
        </span>
        <span className="font-body text-xs text-neutral-mid group-hover:text-white/90">
          Staff available {OFFICE.hours}
        </span>
      </span>
    </a>
  )
}
