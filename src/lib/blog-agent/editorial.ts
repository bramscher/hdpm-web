/**
 * Deterministic checks on a finished draft, run after the model's fact-check
 * so a confident reviewer can't wave these through.
 */

// Post #57 opened with "At High Desert Property Management, we work…" before
// restating a competitor's figures. HDPM may appear in the call-to-action, but
// the article can't claim HDPM experience, observations or data it doesn't have.
const HDPM_EXPERIENCE =
  /\b(in our experience|we(?:[’']ve| have) (?:seen|noticed|found|observed|learned)|we see\b|we often see|our (?:data|numbers|portfolio|clients|owners|tenants|team has (?:seen|found|noticed))|at (?:HDPM|High Desert Property Management),? we (?:see|know|find|notice|have (?:seen|found|noticed)))/i

export interface DraftCheck {
  title: string
  body: string
}

/** Problems that block saving the draft; empty when it may be saved. */
export function editorialProblems(draft: DraftCheck): string[] {
  const problems: string[] = []
  const experience = draft.body.match(HDPM_EXPERIENCE)
  if (experience) problems.push(`Claims HDPM experience or data: "${experience[0]}"`)
  return problems
}

/** A fact-check claim the reviewer checked against the source text. */
export interface CheckedClaim {
  claim: string
  supported: boolean
}

/** Claims the reviewer could not find in the source. */
export function unsupportedClaims(claims: unknown): string[] {
  if (!Array.isArray(claims)) return ['Fact-check returned no claim list']
  return claims
    .filter((c): c is CheckedClaim => typeof c === 'object' && c !== null && 'claim' in c)
    .filter((c) => c.supported !== true)
    .map((c) => String(c.claim))
}
