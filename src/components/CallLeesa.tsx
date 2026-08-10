import Image from 'next/image'

const LEESA_PHONE = '541-406-6409'

/**
 * "Call Leesa" CTA — Leesa is HDPM's AI leasing agent, reachable by phone
 * 24/7. Rendered next to apply/browse actions (listing detail pages, the
 * For Tenants hero) so renters can call for leasing help any time. Pass
 * `className` (e.g. `w-full`) to fit the surrounding layout.
 */
export default function CallLeesa({ className = '' }: { className?: string }) {
  return (
    <a
      href={`tel:${LEESA_PHONE.replace(/\D/g, '')}`}
      aria-label={`Call Leesa, our AI leasing agent, available 24/7, at ${LEESA_PHONE}`}
      className={`group inline-flex items-center gap-3 rounded-full border border-accent/30 bg-white py-2 pl-2 pr-5 shadow-sm transition-all hover:border-accent hover:shadow-md ${className}`}
    >
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
        <Image
          src="/agents/leesa.png"
          alt="Leesa, AI leasing agent"
          fill
          sizes="44px"
          className="object-cover object-top"
        />
      </span>
      <span className="flex flex-col leading-tight">
        <span className="flex items-center gap-1.5 font-heading text-sm font-bold text-neutral-dark">
          Call Leesa
          <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            24/7
          </span>
        </span>
        <span className="font-body text-xs text-neutral-mid">
          AI Leasing Agent · {LEESA_PHONE}
        </span>
      </span>
    </a>
  )
}
