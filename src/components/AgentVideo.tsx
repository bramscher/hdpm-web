import type { Agent } from '@/lib/agents'

/**
 * Talking-avatar intro video for one AI agent. Full narrated clip (has audio),
 * so it plays on click with the still image as the poster — never autoplays.
 *
 * The frame is square, not 16:9: the poster still is a portrait headshot, so a
 * wide frame would crop it to a top band (just the top of the head). A square
 * shows the full face on the poster, and center-crops the 16:9 clip — whose
 * subject is already centered — cleanly during playback.
 */
export default function AgentVideo({ agent, className = '' }: { agent: Agent; className?: string }) {
  return (
    <video
      className={`aspect-square w-full rounded-xl border border-neutral-200 bg-neutral-100 object-cover object-top shadow-sm ${className}`}
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
