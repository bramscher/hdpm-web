'use client'

import { useMemo, useState } from 'react'
import { Field, FieldGroup, ResultsPanel, Stat } from './calc-ui'
import { formatCurrency, formatPercent, mortgagePayment, num } from '@/lib/tools/finance'

/**
 * Rental Property ROI Calculator — models financing + operations to show
 * monthly cash flow, cap rate, cash-on-cash return, and a 10-year projection.
 */
export default function RoiCalculator() {
  // Financing
  const [price, setPrice] = useState('500000')
  const [downPct, setDownPct] = useState('25')
  const [rate, setRate] = useState('6.75')
  const [termYears, setTermYears] = useState('30')
  const [closing, setClosing] = useState('9000')
  const [repairs, setRepairs] = useState('5000')
  // Operating
  const [rent, setRent] = useState('2400')
  const [vacancy, setVacancy] = useState('5')
  const [taxes, setTaxes] = useState('4000')
  const [insurance, setInsurance] = useState('1200')
  const [maintenance, setMaintenance] = useState('2400')
  const [mgmtPct, setMgmtPct] = useState('8')
  const [hoaMonthly, setHoaMonthly] = useState('0')
  const [growth, setGrowth] = useState('3')

  const r = useMemo(() => {
    const p = num(price)
    const downAmt = p * (num(downPct) / 100)
    const loan = Math.max(0, p - downAmt)
    const piMonthly = mortgagePayment(loan, num(rate), num(termYears) * 12)
    const cashInvested = downAmt + num(closing) + num(repairs)

    const grossAnnual = num(rent) * 12
    const egi = grossAnnual * (1 - num(vacancy) / 100)
    const mgmtFee = egi * (num(mgmtPct) / 100)
    const opex = num(taxes) + num(insurance) + num(maintenance) + mgmtFee + num(hoaMonthly) * 12
    const noi = egi - opex
    const annualDebt = piMonthly * 12
    const annualCashFlow = noi - annualDebt
    const capRate = p > 0 ? (noi / p) * 100 : NaN
    const cashOnCash = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : NaN

    // 10-year projection: NOI grows at `growth`, debt service is fixed.
    const g = num(growth) / 100
    let noi10 = 0
    let cf10 = 0
    for (let y = 0; y < 10; y++) {
      const noiY = noi * Math.pow(1 + g, y)
      noi10 += noiY
      cf10 += noiY - annualDebt
    }

    return {
      downAmt,
      loan,
      piMonthly,
      cashInvested,
      noi,
      annualCashFlow,
      monthlyCashFlow: annualCashFlow / 12,
      capRate,
      cashOnCash,
      noi10,
      cf10,
    }
  }, [price, downPct, rate, termYears, closing, repairs, rent, vacancy, taxes, insurance, maintenance, mgmtPct, hoaMonthly, growth])

  const cfTone = r.monthlyCashFlow >= 0 ? 'positive' : 'negative'

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <div className="space-y-8">
        <FieldGroup title="Financing">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="roi-price" label="Purchase price" prefix="$" value={price} onChange={setPrice} />
            <Field id="roi-down" label="Down payment" suffix="%" value={downPct} onChange={setDownPct} step={1} hint={`= ${formatCurrency(r.downAmt)}`} />
            <Field id="roi-rate" label="Interest rate" suffix="%" value={rate} onChange={setRate} step={0.125} />
            <Field id="roi-term" label="Loan term" suffix="yrs" value={termYears} onChange={setTermYears} step={1} />
            <Field id="roi-closing" label="Closing costs" prefix="$" value={closing} onChange={setClosing} />
            <Field id="roi-repairs" label="Initial repairs / capex" prefix="$" value={repairs} onChange={setRepairs} />
          </div>
        </FieldGroup>

        <FieldGroup title="Operating">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field id="roi-rent" label="Monthly rent" prefix="$" value={rent} onChange={setRent} />
            <Field id="roi-vac" label="Vacancy" suffix="%" value={vacancy} onChange={setVacancy} step={0.5} />
            <Field id="roi-taxes" label="Property taxes / yr" prefix="$" value={taxes} onChange={setTaxes} />
            <Field id="roi-ins" label="Insurance / yr" prefix="$" value={insurance} onChange={setInsurance} />
            <Field id="roi-maint" label="Maintenance / yr" prefix="$" value={maintenance} onChange={setMaintenance} />
            <Field id="roi-mgmt" label="Management fee" suffix="%" value={mgmtPct} onChange={setMgmtPct} step={0.5} />
            <Field id="roi-hoa" label="HOA / other" prefix="$" suffix="/mo" value={hoaMonthly} onChange={setHoaMonthly} />
            <Field id="roi-growth" label="Annual rent growth" suffix="%" value={growth} onChange={setGrowth} step={0.5} hint="Used for the 10-yr projection" />
          </div>
        </FieldGroup>
      </div>

      <ResultsPanel
        title="Your returns"
        footnote="Estimates only, before income taxes and depreciation. The 10-year projection assumes net operating income grows at your rent-growth rate and debt service stays fixed. Ask us for a Central Oregon market-specific analysis."
      >
        <Stat label="Monthly cash flow" value={formatCurrency(r.monthlyCashFlow)} emphasis tone={cfTone} />
        <Stat label="Cash-on-cash" value={formatPercent(r.cashOnCash, 1)} emphasis tone="positive" />
        <Stat label="Cap rate" value={formatPercent(r.capRate, 2)} />
        <Stat label="Annual NOI" value={formatCurrency(r.noi)} />
        <Stat label="Monthly P&I" value={formatCurrency(r.piMonthly)} />
        <Stat label="Cash invested" value={formatCurrency(r.cashInvested)} />
        <Stat label="10-yr cash flow" value={formatCurrency(r.cf10)} />
        <Stat label="Loan amount" value={formatCurrency(r.loan)} />
      </ResultsPanel>
    </div>
  )
}
