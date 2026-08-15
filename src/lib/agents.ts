/**
 * HDPM's three AI phone agents — single source of truth for their names,
 * numbers, and the prefilled text people see when they choose to text instead
 * of call. During business hours they answer overflow (when the team is on
 * another call); after hours they're the primary responders. Sally routes
 * callers to Leesa (leasing) or Max (maintenance) as needed. Max is the only
 * true around-the-clock agent.
 */

export type AgentId = 'leesa' | 'sally' | 'max'

export interface Agent {
  id: AgentId
  name: string
  role: string
  image: string
  /** Talking-avatar intro video (16:9), poster falls back to `image`. */
  video: string
  /** One-line description of what this agent helps with. */
  tagline: string
  /** Marketing availability label — only Max is genuinely 24/7. */
  availability: '24/7' | 'After hours'
  /** Human-formatted number, e.g. '541-406-6409'. */
  phone: string
  /** Prefilled body shown when someone taps "Text". */
  smsGreeting: string
}

export const AGENTS: Record<AgentId, Agent> = {
  leesa: {
    id: 'leesa',
    name: 'Leesa',
    role: 'Leasing',
    image: '/agents/leesa.png',
    video: '/agents/leesa.mp4',
    tagline: 'Current availability, applications, and booking tours.',
    availability: 'After hours',
    phone: '541-406-6409',
    smsGreeting: 'Hi Leesa, I have a question about a rental.',
  },
  sally: {
    id: 'sally',
    name: 'Sally',
    role: 'General Questions',
    image: '/agents/sally.png',
    video: '/agents/sally.mp4',
    tagline: 'General questions, plus routing to Leesa or Max.',
    availability: 'After hours',
    phone: '541-548-0383',
    smsGreeting: 'Hi Sally, I have a question for High Desert Property Management.',
  },
  max: {
    id: 'max',
    name: 'Max',
    role: 'Maintenance',
    image: '/agents/max.png',
    video: '/agents/max.mp4',
    tagline: 'Maintenance requests and emergencies, day or night.',
    availability: '24/7',
    phone: '541-600-2592',
    smsGreeting: "Hi Max, I'd like to report a maintenance issue.",
  },
}

export const AGENT_LIST: Agent[] = [AGENTS.leesa, AGENTS.sally, AGENTS.max]

/** `tel:` href — digits only, E.164 with the US country code. */
export function telHref(phone: string): string {
  return `tel:+1${phone.replace(/\D/g, '')}`
}

/**
 * `sms:` href with an optional prefilled body. Uses the `?&body=` form, which
 * is the one combination iOS and Android both parse correctly (iOS expects the
 * separator to be `&`, Android expects `?`).
 */
export function smsHref(phone: string, body?: string): string {
  const num = `+1${phone.replace(/\D/g, '')}`
  return body ? `sms:${num}?&body=${encodeURIComponent(body)}` : `sms:${num}`
}
