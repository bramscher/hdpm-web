'use client'

import { useMemo, useState } from 'react'
import { Field, FieldGroup, ResultsPanel, Stat, Toggle } from './calc-ui'
import { compound, formatCurrency, mortgagePayment, num, remainingBalance } from '@/lib/tools/finance'

/**
 * Rent vs Sell Calculator — compares selling now and reinvesting the proceeds
 * against renting the property and selling after a chosen holding period.
 * Models mortgage amortization, appreciation, rent growth, operating costs,
 * selling costs, and capital-gains tax (incl. the §121 primary-residence
 * exclusion). Estimate only — not tax advice.
 */
export default function RentVsSellCalculator() {
  // Property basics
  const [value, setValue] = useState('550000')
  const [pricePaid, setPricePaid] = useState('380000')
  const [balance, setBalance] = useState('250000')
  const [rate, setRate] = useState('4.25')
  const [remMonths, setRemMonths] = useState('300')
  const [rent, setRent] = useState('2600')
  const [holdYears, setHoldYears] = useState('10')
  const [primary, setPrimary] = useState<'yes' | 'no'>('no')
  const [filing, setFiling] = useState<'single' | 'married'>('married')
  // Operating assumptions
  const [fixedMonthly, setFixedMonthly] = useState('550')
  const [pmPct, setPmPct] = useState('8')
  const [occupancy, setOccupancy] = useState('95')
  const [maintPct, setMaintPct] = useState('1')
  const [rentGrowth, setRentGrowth] = useState('3')
  const [appreciation, setAppreciation] = useState('3.5')
  const [makeReady, setMakeReady] = useState('4000')
  // Sale assumptions
  const [sellCostPct, setSellCostPct] = useState('7')
  const [cgRate, setCgRate] = useState('15')
  const [reinvestPct, setReinvestPct] = useState('5')

  const r = useMemo(() => {
    const N = Math.max(1, Math.round(num(holdYears)))
    const isPrimary = primary === 'yes'
    const exclusion = isPrimary ? (filing === 'married' ? 500000 : 250000) : 0
    const piMonthly = mortgagePayment(num(balance), num(rate), num(remMonths))

    // --- Sell now ---
    const sellCostsNow = num(value) * (num(sellCostPct) / 100)
    const gainNow = num(value) - num(pricePaid) - sellCostsNow
    const taxNow = Math.max(0, gainNow - exclusion) * (num(cgRate) / 100)
    const netIfSoldNow = num(value) - num(balance) - sellCostsNow - taxNow

    const netSaleAt = (years: number) => {
      const fv = compound(num(value), num(appreciation), years)
      const sc = fv * (num(sellCostPct) / 100)
      const bal = remainingBalance(num(balance), num(rate), num(remMonths), years * 12)
      // Primary-residence exclusion only survives a short rental window (~2-of-5 rule).
      const excl = isPrimary && years <= 3 ? exclusion : 0
      const gain = fv - num(pricePaid) - sc
      const tax = Math.max(0, gain - excl) * (num(cgRate) / 100)
      return fv - bal - sc - tax
    }

    // --- Rent then sell: walk year by year ---
    let cumCF = -num(makeReady)
    let breakeven: number | null = null
    for (let i = 1; i <= N; i++) {
      const y = i - 1
      const rentY = num(rent) * 12 * (num(occupancy) / 100) * Math.pow(1 + num(rentGrowth) / 100, y)
      const pmFee = rentY * (num(pmPct) / 100)
      const maint = compound(num(value), num(appreciation), y) * (num(maintPct) / 100)
      const fixed = num(fixedMonthly) * 12
      const debt = i <= num(remMonths) / 12 ? piMonthly * 12 : 0
      cumCF += rentY - pmFee - maint - fixed - debt

      const rentPath = cumCF + netSaleAt(i)
      const sellPath = netIfSoldNow * Math.pow(1 + num(reinvestPct) / 100, i)
      if (breakeven === null && rentPath >= sellPath) breakeven = i
    }

    const rentThenSell = cumCF + netSaleAt(N)
    const sellNowReinvested = netIfSoldNow * Math.pow(1 + num(reinvestPct) / 100, N)
    const diff = rentThenSell - sellNowReinvested
    const tolerance = 0.02 * Math.max(Math.abs(rentThenSell), Math.abs(sellNowReinvested), 1)

    let verdict: string
    if (Math.abs(diff) <= tolerance) verdict = 'Roughly a tie'
    else if (diff > 0) verdict = `Renting then selling wins by ${formatCurrency(diff)}`
    else verdict = `Selling now wins by ${formatCurrency(-diff)}`

    return { N, netIfSoldNow, sellNowReinvested, rentThenSell, cumCF, futureNetSale: netSaleAt(N), breakeven, verdict, diff }
  }, [value, pricePaid, balance, rate, remMonths, rent, holdYears, primary, filing, fixedMonthly, pmPct, occupancy, maintPct, rentGrowth, appreciation, makeReady, sellCostPct, cgRate, reinvestPct])

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <div className="space-y-8">
        <FieldGroup title="Property basics">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="rs-value" label="Current home value" prefix="$" value={value} onChange={setValue} />
            <Field id="rs-paid" label="Price you paid" prefix="$" value={pricePaid} onChange={setPricePaid} />
            <Field id="rs-bal" label="Mortgage balance" prefix="$" value={balance} onChange={setBalance} />
            <Field id="rs-rate" label="Mortgage rate" suffix="%" value={rate} onChange={setRate} step={0.125} />
            <Field id="rs-rem" label="Payments remaining" suffix="mo" value={remMonths} onChange={setRemMonths} />
            <Field id="rs-rent" label="Monthly rent" prefix="$" value={rent} onChange={setRent} />
            <Field id="rs-hold" label="Years to hold" suffix="yrs" value={holdYears} onChange={setHoldYears} step={1} />
            <Toggle id="rs-primary" label="Primary residence?" value={primary} onChange={setPrimary} options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
            {primary === 'yes' && (
              <Toggle id="rs-filing" label="Tax filing" value={filing} onChange={setFiling} options={[{ value: 'single', label: 'Single' }, { value: 'married', label: 'Married' }]} />
            )}
          </div>
        </FieldGroup>

        <FieldGroup title="Operating assumptions">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="rs-fixed" label="Taxes, insurance, HOA" prefix="$" suffix="/mo" value={fixedMonthly} onChange={setFixedMonthly} />
            <Field id="rs-pm" label="Management fee" suffix="%" value={pmPct} onChange={setPmPct} step={0.5} />
            <Field id="rs-occ" label="Occupancy" suffix="%" value={occupancy} onChange={setOccupancy} step={1} />
            <Field id="rs-maint" label="Annual maintenance" suffix="%" value={maintPct} onChange={setMaintPct} step={0.25} hint="Of home value" />
            <Field id="rs-rg" label="Annual rent growth" suffix="%" value={rentGrowth} onChange={setRentGrowth} step={0.5} />
            <Field id="rs-appr" label="Appreciation" suffix="%" value={appreciation} onChange={setAppreciation} step={0.5} />
            <Field id="rs-mr" label="Make-ready cost" prefix="$" value={makeReady} onChange={setMakeReady} hint="One-time, to rent-ready it" />
          </div>
        </FieldGroup>

        <FieldGroup title="Sale & tax assumptions">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="rs-sc" label="Selling costs" suffix="%" value={sellCostPct} onChange={setSellCostPct} step={0.5} hint="Agent + closing + transfer" />
            <Field id="rs-cg" label="Capital gains rate" suffix="%" value={cgRate} onChange={setCgRate} step={1} />
            <Field id="rs-ri" label="Reinvestment return" suffix="%" value={reinvestPct} onChange={setReinvestPct} step={0.5} hint="If you sell & reinvest proceeds" />
          </div>
        </FieldGroup>
      </div>

      <ResultsPanel
        title={`Over ${r.N} years`}
        footnote="Estimate only — not tax advice. Pre-income-tax operating cash flow; excludes depreciation recapture. The §121 exclusion is applied to the rental path only for short holds (~2-of-5-year rule). Talk to your CPA, and ask us for a Central Oregon rent projection."
      >
        <div className="col-span-2 rounded-lg bg-white/5 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-white/60">Verdict</p>
          <p className="mt-1 font-heading text-subtitle font-bold text-accent-light">{r.verdict}</p>
        </div>
        <Stat label="Sell now (reinvested)" value={formatCurrency(r.sellNowReinvested)} emphasis />
        <Stat label="Rent then sell" value={formatCurrency(r.rentThenSell)} emphasis tone="positive" />
        <Stat label="Net if sold now" value={formatCurrency(r.netIfSoldNow)} />
        <Stat label="Cumulative cash flow" value={formatCurrency(r.cumCF)} tone={r.cumCF >= 0 ? 'positive' : 'negative'} />
        <Stat label="Future net sale" value={formatCurrency(r.futureNetSale)} />
        <Stat label="Breakeven year" value={r.breakeven ? `Year ${r.breakeven}` : '—'} />
      </ResultsPanel>
    </div>
  )
}
