import { createMetadata } from '@/lib/seo'
import { getTool, TOOLS_BASE } from '@/lib/tools/registry'
import ToolPageShell from '@/components/tools/ToolPageShell'
import RoiCalculator from '@/components/tools/RoiCalculator'

const tool = getTool('roi-calculator')!

export function generateMetadata() {
  return createMetadata({
    title: 'Rental Property ROI Calculator',
    description:
      'Free rental property ROI calculator: enter price, financing, rent, and expenses to see monthly cash flow, cap rate, cash-on-cash return, and a 10-year projection.',
    path: `${TOOLS_BASE}/roi-calculator`,
  })
}

const faqs = [
  {
    question: 'What is a good cash-on-cash return on a rental?',
    answer:
      'Many Central Oregon investors target roughly 6–10% cash-on-cash, though it depends heavily on your down payment, financing rate, and how much cash you put in up front. Cash-on-cash divides your annual pre-tax cash flow by the total cash you invested.',
  },
  {
    question: 'How is cap rate different from cash-on-cash return?',
    answer:
      'Cap rate is net operating income divided by the purchase price and ignores financing, so it lets you compare properties on equal footing. Cash-on-cash factors in your loan and down payment to show what your actual invested cash earns this year.',
  },
  {
    question: 'Does this ROI calculator include income taxes and depreciation?',
    answer:
      'No. It models pre-income-tax cash flow and returns. Depreciation, tax brackets, and deductions can meaningfully change your after-tax result, so treat these as planning estimates and confirm with your CPA.',
  },
  {
    question: 'What down payment should I assume for a rental?',
    answer:
      'Investment-property loans commonly require 20–25% down. The calculator defaults to 25% — adjust it to match your financing, and the cash-invested and cash-on-cash figures update instantly.',
  },
]

export default function RoiCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      analyticsTag="tool_roi"
      intro="Estimate the return on a rental purchase. Enter your financing and operating assumptions to see monthly cash flow, cap rate, cash-on-cash return, and a 10-year projection — updating live as you type."
      faqs={faqs}
    >
      <RoiCalculator />
    </ToolPageShell>
  )
}
