/** Single source of truth for the /tools calculators — used by the hub page,
 *  related-tool links, and the sitemap. */
export const TOOLS_BASE = '/tools'

export interface ToolMeta {
  slug: string
  /** Full page <h1> / title */
  title: string
  /** Short label for cards and related-tool links */
  short: string
  blurb: string
}

export const TOOLS: ToolMeta[] = [
  {
    slug: 'roi-calculator',
    title: 'Rental Property ROI Calculator',
    short: 'ROI Calculator',
    blurb: 'Model monthly cash flow, cap rate, and cash-on-cash return on a rental purchase.',
  },
  {
    slug: 'cap-rate-calculator',
    title: 'Cap Rate Calculator',
    short: 'Cap Rate Calculator',
    blurb: 'Turn rent and operating expenses into NOI and a cap rate to compare properties.',
  },
  {
    slug: 'rent-vs-sell',
    title: 'Rent vs Sell Calculator',
    short: 'Rent vs Sell',
    blurb: 'Compare selling now and reinvesting against renting your property and selling later.',
  },
]

export function getTool(slug: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.slug === slug)
}
