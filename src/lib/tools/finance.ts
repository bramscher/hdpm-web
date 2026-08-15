/**
 * Pure finance helpers shared by the owner/investor calculators under /tools.
 * No React, no side effects — kept separate so the math is easy to reason about
 * and unit-test independently of the UI.
 */

/** Monthly principal + interest payment for a fully-amortizing loan. */
export function mortgagePayment(
  principal: number,
  annualRatePct: number,
  months: number,
): number {
  if (principal <= 0 || months <= 0) return 0
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal / months
  return (principal * r) / (1 - Math.pow(1 + r, -months))
}

/**
 * Remaining loan balance after `monthsElapsed` payments on a loan of
 * `principal` over `totalMonths` at `annualRatePct`.
 */
export function remainingBalance(
  principal: number,
  annualRatePct: number,
  totalMonths: number,
  monthsElapsed: number,
): number {
  if (principal <= 0 || totalMonths <= 0) return 0
  const elapsed = Math.min(monthsElapsed, totalMonths)
  const r = annualRatePct / 100 / 12
  if (r === 0) return principal * (1 - elapsed / totalMonths)
  const pow = (m: number) => Math.pow(1 + r, m)
  const bal = (principal * (pow(totalMonths) - pow(elapsed))) / (pow(totalMonths) - 1)
  return Math.max(0, bal)
}

/** Compound a value forward `years` at `ratePct` per year. */
export function compound(value: number, ratePct: number, years: number): number {
  return value * Math.pow(1 + ratePct / 100, years)
}

/** Coerce a possibly-empty/invalid form string to a finite number. */
export function num(value: string | number | undefined | null, fallback = 0): number {
  if (value === '' || value == null) return fallback
  const n = typeof value === 'number' ? value : parseFloat(value)
  return Number.isFinite(n) ? n : fallback
}

const usd0 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})
const usd2 = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

export function formatCurrency(n: number, cents = false): string {
  if (!Number.isFinite(n)) return '—'
  return (cents ? usd2 : usd0).format(n)
}

export function formatPercent(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '—'
  return `${n.toFixed(digits)}%`
}
