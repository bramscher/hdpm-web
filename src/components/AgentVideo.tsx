import type { Agent } from '@/lib/agents'

/**
 * Talking-avatar intro video for one AI agent. Full narrated clip (has audio),
 * so it plays on click with the still image as the poster — never autoplays.
 */
export default function AgentVideo({ agent, className = '' }: { agent: Agent; className?: string }) {
  return (
    <video
      className={`aspect-video w-full rounded-xl border border-neutral-200 bg-neutral-100 object-cover shadow-sm ${className}`}
      poster={agent.image}
      preload="metadata"
      controls
      playsInline
    >
      <source src={agent.video} type="video/mp4" />
      Your browser doesn’t support embedded video. Call {agent.name} at {agent.phone}.
    </video>
  )
}
