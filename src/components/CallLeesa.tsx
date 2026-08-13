import CallAgent from '@/components/CallAgent'
import { AGENTS } from '@/lib/agents'

/**
 * "Call/Text Leesa" CTA — Leesa is HDPM's AI leasing agent, reachable by phone
 * or text. Rendered next to apply/browse actions (listing detail pages, listing
 * cards, the For Tenants hero) so renters can reach her whichever way they
 * prefer. Thin wrapper over the shared <CallAgent> so every agent pill stays
 * consistent site-wide. Pass `className` (e.g. `w-full`) to fit the layout.
 */
export default function CallLeesa({ className = '' }: { className?: string }) {
  return <CallAgent agent={AGENTS.leesa} className={className} />
}
