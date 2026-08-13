import Image from 'next/image'
import { type Agent, telHref, smsHref } from '@/lib/agents'

/**
 * Contact pill for one of HDPM's AI agents: avatar + name, with a Call action
 * and a Text action side by side so people can reach the agent whichever way
 * they prefer. Both actions always show/announce the dialable number so a
 * device that can't place a tel:/sms: (e.g. a desktop with no calling app) can
 * still read and use it. Pass `className` (e.g. `w-full`) to fit the layout.
 */
export default function CallAgent({
  agent,
  className = '',
}: {
  agent: Agent
  className?: string
}) {
  return (
    <div
      className={`inline-flex items-center gap-3 rounded-full border border-accent/30 bg-white py-2 pl-2 pr-3 shadow-sm ${className}`}
    >
      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
        <Image
          src={agent.image}
          alt={`${agent.name}, AI ${agent.role.toLowerCase()} agent`}
          fill
          sizes="44px"
          className="object-cover object-top"
        />
      </span>

      <span className="flex min-w-0 flex-col leading-tight">
        <span className="flex items-center gap-1.5 font-heading text-sm font-bold text-neutral-dark">
          {agent.name}
          {agent.availability === '24/7' && (
            <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              24/7
            </span>
          )}
        </span>
        <span className="truncate font-body text-xs text-neutral-mid">
          AI {agent.role} Agent · {agent.phone}
        </span>
      </span>

      <span className="ml-auto flex shrink-0 items-center gap-1.5">
        <a
          href={telHref(agent.phone)}
          aria-label={`Call ${agent.name} at ${agent.phone}`}
          className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-accent-dark"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
            />
          </svg>
          Call
        </a>
        <a
          href={smsHref(agent.phone, agent.smsGreeting)}
          aria-label={`Text ${agent.name} at ${agent.phone}`}
          className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/5 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:border-accent hover:bg-accent hover:text-white"
        >
          <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
            />
          </svg>
          Text
        </a>
      </span>
    </div>
  )
}
