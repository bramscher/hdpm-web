'use client'

import { useMemo, useState } from 'react'
import { Field, FieldGroup, ResultsPanel, Stat } from './calc-ui'
import { formatCurrency, formatPercent, num } from '@/lib/tools/finance'

/**
 * Cap Rate Calculator — builds NOI from rent and operating expenses, then
 * derives cap rate, gross yield, and GRM. Financing is intentionally excluded
 * (cap rate compares assets independent of how they're financed).
 */
export default function CapRateCalculator() {
  const [value, setValue] = useState('500000')
  const [rent, setRent] = useState('2400')
  const [vacancy, setVacancy] = useState('5')
  const [taxes, setTaxes] = useState('4000')
  const [insurance, setInsurance] = useState('1200')
  const [maintenance, setMaintenance] = useState('2400')
  const [mgmtPct, setMgmtPct] = useState('8')
  const [other, setOther] = useState('0')

  const r = useMemo(() => {
    const price = num(value)
    const grossAnnual = num(rent) * 12
    const egi = grossAnnual * (1 - num(vacancy) / 100)
    const mgmtFee = egi * (num(mgmtPct) / 100)
    const opex = num(taxes) + num(insurance) + num(maintenance) + mgmtFee + num(other)
    const noi = egi - opex
    const capRate = price > 0 ? (noi / price) * 100 : NaN
    const grossYield = price > 0 ? (grossAnnual / price) * 100 : NaN
    const grm = grossAnnual > 0 ? price / grossAnnual : NaN
    return { noi, capRate, grossYield, grm, egi, opex, mgmtFee }
  }, [value, rent, vacancy, taxes, insurance, maintenance, mgmtPct, other])

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,22rem)]">
      <FieldGroup title="Property & income">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="cr-value" label="Property value / price" prefix="$" value={value} onChange={setValue} />
          <Field id="cr-rent" label="Monthly rent" prefix="$" value={rent} onChange={setRent} />
          <Field id="cr-vac" label="Vacancy" suffix="%" value={vacancy} onChange={setVacancy} step={0.5} />
          <Field id="cr-mgmt" label="Management fee" suffix="%" value={mgmtPct} onChange={setMgmtPct} step={0.5} hint="On collected rent" />
          <Field id="cr-taxes" label="Property taxes / yr" prefix="$" value={taxes} onChange={setTaxes} />
          <Field id="cr-ins" label="Insurance / yr" prefix="$" value={insurance} onChange={setInsurance} />
          <Field id="cr-maint" label="Maintenance / yr" prefix="$" value={maintenance} onChange={setMaintenance} />
          <Field id="cr-other" label="Other expenses / yr" prefix="$" value={other} onChange={setOther} hint="HOA, utilities, etc." />
        </div>
      </FieldGroup>

      <ResultsPanel
        title="Your numbers"
        footnote="Estimates only. Cap rate uses net operating income before financing, capital expenditures, and taxes. Actual returns vary — ask us for a market-specific analysis."
      >
        <Stat label="Cap rate" value={formatPercent(r.capRate, 2)} emphasis tone="positive" />
        <Stat label="Annual NOI" value={formatCurrency(r.noi)} emphasis />
        <Stat label="Gross yield" value={formatPercent(r.grossYield, 2)} />
        <Stat label="Gross rent multiplier" value={Number.isFinite(r.grm) ? r.grm.toFixed(1) : '—'} />
        <Stat label="Effective gross income" value={formatCurrency(r.egi)} />
        <Stat label="Operating expenses" value={formatCurrency(r.opex)} />
      </ResultsPanel>
    </div>
  )
}
