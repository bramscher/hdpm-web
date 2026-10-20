/**
 * Shared Claude access for the blog agent: one model, and a JSON helper that
 * uses structured outputs so review verdicts can't come back half-formed.
 */

import Anthropic from '@anthropic-ai/sdk'
import { SourceGroundingError } from './freshness'

export const BLOG_MODEL = 'claude-opus-5-5'

let client: Anthropic | null = null

export function claude(): Anthropic {
  const apiKey = process.env.CLAUDE_API_KEY || ''
  if (!apiKey) throw new Error('CLAUDE_API_KEY not configured')
  client ??= new Anthropic({ apiKey })
  return client
}

/**
 * One structured-output call. Streams (thinking is always on for this model,
 * so long outputs would otherwise risk HTTP timeouts) and parses the JSON.
 * Throws SourceGroundingError when the answer is incomplete or unparseable, so
 * callers treat it like any other failed review: no draft.
 */
export async function askJson<T>(opts: {
  system: string
  user: string
  schema: Record<string, unknown>
  effort: 'low' | 'medium' | 'high'
  maxTokens?: number
  what: string
}): Promise<T> {
  const message = await claude()
    .messages.stream({
      model: BLOG_MODEL,
      max_tokens: opts.maxTokens ?? 32000,
      system: opts.system,
      output_config: { effort: opts.effort, format: { type: 'json_schema', schema: opts.schema } },
      messages: [{ role: 'user', content: opts.user }],
    })
    .finalMessage()
  if (message.stop_reason !== 'end_turn') {
    throw new SourceGroundingError(`${opts.what} was incomplete (${message.stop_reason}); no draft was saved.`)
  }
  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('')
  try {
    return JSON.parse(text) as T
  } catch {
    throw new SourceGroundingError(`${opts.what} returned unreadable output; no draft was saved.`)
  }
}
