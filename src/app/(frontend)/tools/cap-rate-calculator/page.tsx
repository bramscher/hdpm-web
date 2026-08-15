import { createMetadata } from '@/lib/seo'
import { getTool, TOOLS_BASE } from '@/lib/tools/registry'
import ToolPageShell from '@/components/tools/ToolPageShell'
import CapRateCalculator from '@/components/tools/CapRateCalculator'

const tool = getTool('cap-rate-calculator')!

export function generateMetadata() {
  return createMetadata({
    title: 'Cap Rate Calculator',
    description:
      'Free cap rate calculator: enter property value, rent, and operating expenses to compute net operating income (NOI), cap rate, gross yield, and gross rent multiplier.',
    path: `${TOOLS_BASE}/cap-rate-calculator`,
  })
}

const faqs = [
  {
    question: 'What is a cap rate?',
    answer:
      'The capitalization rate is a property’s annual net operating income (NOI) divided by its value or purchase price. It expresses the unlevered yield of the asset — what it earns before any mortgage — so you can compare properties on equal terms.',
  },
  {
    question: 'What is a good cap rate for a rental property?',
    answer:
      'It varies by market and property type. In stable residential markets like Central Oregon, single-family rentals often trade at lower cap rates than riskier assets because appreciation and demand are strong. Compare a property’s cap rate to similar local listings rather than a national rule of thumb.',
  },
  {
    question: 'Why doesn’t the cap rate include my mortgage?',
    answer:
      'By design. Cap rate measures the property itself, independent of how you finance it, so two buyers with different loans can still compare the same asset. To factor in financing, use the cash-on-cash return in our ROI calculator.',
  },
  {
    question: 'What is the gross rent multiplier (GRM)?',
    answer:
      'GRM is the property price divided by its annual gross rent. It’s a quick screening ratio — a lower GRM suggests more rent per dollar of price — but unlike cap rate it ignores operating expenses.',
  },
]

export default function CapRateCalculatorPage() {
  return (
    <ToolPageShell
      tool={tool}
      analyticsTag="tool_cap_rate"
      intro="Turn rent and operating expenses into a property’s net operating income and cap rate. Adjust any input to instantly see how it moves your yield — no financing required."
      faqs={faqs}
    >
      <CapRateCalculator />
    </ToolPageShell>
  )
}
