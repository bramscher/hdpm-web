import CallAgent from '@/components/CallAgent'
import { AGENTS } from '@/lib/agents'

/**
 * "Call/Text Leesa" CTA — Leesa is HDPM's AI leasing agent, reachable by phone
 * or text. Rendered next to apply/browse actions (listing detail pages, listing
 * cards, the For Tenants hero) so renters can reach her whichever way they
 * prefer. Thin wrapper over the shared <CallAgent> so every agent pill stays
 * consistent site-wide. Pass `className` (e.g. `w-full`) to fit the layout.
 */
export default function CallLeesa({
  className = '',
  propertyAddress,
}: {
  className?: string
  propertyAddress?: string
}) {
  const address = propertyAddress?.trim()

  return (
    <CallAgent
      agent={AGENTS.leesa}
      className={className}
      smsBody={address ? `Hi Leesa, I have a question about the rental at ${address}.` : undefined}
    />
  )
}
