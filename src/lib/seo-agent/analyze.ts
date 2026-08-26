/**
 * SEO agent core: picks opportunity pages from GSC data and asks Claude for
 * metadata improvements, constrained by HDPM's content rules. Suggestions are
 * stored for human review — nothing is applied automatically.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { GscRow } from './gsc'

const ANTHROPIC_API_KEY =
  process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || ''

export interface PageOpportunity {
  path: string
  clicks: number
  impressions: number
  ctr: number
  position: number
  topQueries: Array<{ query: string; impressions: number; position: number }>
}

export interface PastExperiment {
  field: string
  suggestedValue: string
  outcome: string | null
}

export interface Suggestion {
  field: 'seoTitle' | 'seoDescription' | 'content'
  suggested_value: string
  rationale: string
  target_queries: string[]
}

/**
 * Rank pages worth working on: high impressions with weak CTR, or queries in
 * "striking distance" (position 4–20 where a better snippet/content can move
 * the needle). Returns the top `limit` opportunities.
 */
export function pickOpportunities(
  pageRows: GscRow[],
  queryRows: GscRow[],
  limit = 5,
): PageOpportunity[] {
  const queriesByPage = new Map<string, GscRow[]>()
  for (const row of queryRows) {
    const [page] = row.keys
    const list = queriesByPage.get(page) || []
    list.push(row)
    queriesByPage.set(page, list)
  }

  return pageRows
    .filter((r) => r.impressions >= 50) // ignore pages with no meaningful data
    .map((r) => {
      const [path] = r.keys
      const topQueries = (queriesByPage.get(path) || [])
        .sort((a, b) => b.impressions - a.impressions)
        .slice(0, 8)
        .map((q) => ({
          query: q.keys[1],
          impressions: q.impressions,
          position: q.position,
        }))
      return {
        path,
        clicks: r.clicks,
        impressions: r.impressions,
        ctr: r.ctr,
        position: r.position,
        topQueries,
      }
    })
    .sort((a, b) => {
      // opportunity score: impressions where we underperform.
      // Striking-distance positions (4–20) and low CTR score highest.
      const score = (p: PageOpportunity) => {
        const positionFactor = p.position > 3 && p.position <= 20 ? 2 : 1
        const ctrGap = Math.max(0, 0.05 - p.ctr)
        return p.impressions * (ctrGap + 0.01) * positionFactor
      }
      return score(b) - score(a)
    })
    .slice(0, limit)
}

const SUGGESTION_SCHEMA = {
  type: 'object',
  properties: {
    suggestions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          field: { type: 'string', enum: ['seoTitle', 'seoDescription', 'content'] },
          suggested_value: { type: 'string' },
          rationale: { type: 'string' },
          target_queries: { type: 'array', items: { type: 'string' } },
        },
        required: ['field', 'suggested_value', 'rationale', 'target_queries'],
        additionalProperties: false,
      },
    },
  },
  required: ['suggestions'],
  additionalProperties: false,
} as const

const CONTENT_RULES = `Hard rules for all copy (from the owner — never violate these):
- NEVER mention fees, pricing, percentages, or dollar amounts for management services.
- NEVER cite an exact door/unit count; say "hundreds of doors across Central Oregon".
- Office hours are Monday–Friday 9:00 AM – 4:00 PM.
- The company has served Central Oregon "since 1999" (never 2003 or 2011).
- Company: High Desert Property Management, Redmond OR, (541) 548-0383. Serves Bend, Redmond, Sisters, Prineville, Culver, Metolius, Madras.
- SEO titles must NOT include the brand/company name or a "| High Desert…" suffix — the site automatically appends "| High Desert Property Management". Return only the distinctive part (e.g. "Bend Property Management for Owners"), and keep it under 60 characters INCLUDING that appended brand.`

export async function generateSuggestions(input: {
  opportunity: PageOpportunity
  currentTitle: string | null
  currentDescription: string | null
  pageSummary: string
  pastExperiments: PastExperiment[]
}): Promise<Suggestion[]> {
  if (!ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY / CLAUDE_API_KEY not configured')
  }
  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY })

  const { opportunity, currentTitle, currentDescription, pageSummary, pastExperiments } =
    input

  const experimentNotes = pastExperiments.length
    ? pastExperiments
        .map(
          (e) =>
            `- previously changed ${e.field} to "${e.suggestedValue.slice(0, 120)}" → outcome: ${e.outcome || 'not yet measured'}`,
        )
        .join('\n')
    : 'None yet.'

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 2048,
    thinking: { type: 'adaptive' },
    output_config: {
      format: { type: 'json_schema', schema: SUGGESTION_SCHEMA },
    },
    system: `You are the SEO agent for highdesertpm.com, a residential property management company in Central Oregon. You propose concrete, high-quality improvements to page metadata based on real Google Search Console data. You write titles under 60 characters and descriptions between 140 and 160 characters, front-loading the target query naturally — never keyword-stuffed. You learn from past experiment outcomes: do not repeat approaches that made things worse.

${CONTENT_RULES}`,
    messages: [
      {
        role: 'user',
        content: `Page: ${opportunity.path}

28-day Search Console data:
- clicks ${opportunity.clicks}, impressions ${opportunity.impressions}, CTR ${(opportunity.ctr * 100).toFixed(1)}%, avg position ${opportunity.position.toFixed(1)}

Top queries (impressions / avg position):
${opportunity.topQueries.map((q) => `- "${q.query}" (${q.impressions} / ${q.position.toFixed(1)})`).join('\n')}

Current SEO title: ${currentTitle || '(none set)'}
Current SEO description: ${currentDescription || '(none set)'}

Page content summary:
${pageSummary.slice(0, 1500)}

Past experiments on this page:
${experimentNotes}

Propose up to 2 metadata suggestions (seoTitle and/or seoDescription) that would improve CTR or rankings for the highest-value queries above. Only suggest a change if it is meaningfully better than the current value — return an empty suggestions array if the current metadata is already well-optimized. You may additionally include one 'content' suggestion (advisory prose describing a content addition, e.g. a missing section answering a high-impression query the page doesn't cover).`,
      },
    ],
  })

  if (response.stop_reason === 'refusal') {
    return []
  }
  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return []
  const parsed = JSON.parse(textBlock.text) as { suggestions: Suggestion[] }
  return parsed.suggestions
}
