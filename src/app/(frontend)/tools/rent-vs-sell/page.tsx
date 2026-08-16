import { createMetadata } from '@/lib/seo'
import { getTool, TOOLS_BASE } from '@/lib/tools/registry'
import ToolPageShell from '@/components/tools/ToolPageShell'
import RentVsSellCalculator from '@/components/tools/RentVsSellCalculator'

const tool = getTool('rent-vs-sell')!

export function generateMetadata() {
  return createMetadata({
    title: 'Rent vs Sell Calculator',
    description:
      'Should you sell your house or rent it out? Free rent-vs-sell calculator compares selling now and reinvesting against renting and selling later — with cash flow, appreciation, and capital-gains tax.',
    path: `${TOOLS_BASE}/rent-vs-sell`,
  })
}

const faqs = [
  {
    question: 'Should I sell my house or rent it out?',
    answer:
      'It depends on your equity, mortgage rate, local rent, expected appreciation, and taxes. This calculator projects both paths over your holding period — selling now and reinvesting the proceeds versus renting and selling later — and shows which comes out ahead and by how much.',
  },
  {
    question: 'What is the §121 capital gains exclusion?',
    answer:
      'If a home was your primary residence for at least two of the last five years, IRS Section 121 lets you exclude up to $250,000 of capital gain ($500,000 if married filing jointly) when you sell. The calculator applies it to the sell-now path, and to the rental path only for short holds where you’d likely still qualify.',
  },
  {
    question: 'Does this account for depreciation recapture?',
    answer:
      'Not currently — to keep the estimate simple it excludes depreciation recapture, which can add tax when you sell a property you’ve rented and depreciated. For a precise after-tax picture, review the results with your CPA.',
  },
  {
    question: 'How accurate is this calculator?',
    answer:
      'It’s a planning estimate driven by your assumptions about rent growth, appreciation, and costs. Small changes to those inputs can flip the verdict, so use it to understand the trade-offs — then ask us for a current Central Oregon rent projection to ground the rental side.',
  },
]

export default function RentVsSellPage() {
  return (
    <ToolPageShell
      tool={tool}
      analyticsTag="tool_rent_vs_sell"
      intro="Weigh selling your property now and reinvesting the proceeds against renting it out and selling later. The model includes your mortgage, appreciation, rent growth, operating costs, and capital-gains tax."
      faqs={faqs}
    >
      <RentVsSellCalculator />
    </ToolPageShell>
  )
}
