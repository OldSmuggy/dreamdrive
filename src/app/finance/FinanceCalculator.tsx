'use client'

import { useState, useMemo } from 'react'

function formatAUD(amount: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function calcRepayments(principal: number, years: number, annualRatePct: number) {
  const n = years * 12
  const r = annualRatePct / 100 / 12
  const monthly =
    r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n))
  const total = monthly * n
  const weekly = total / (years * 52)
  return { weekly, monthly, total }
}

export default function FinanceCalculator() {
  const [amount, setAmount] = useState(100000)
  const [years, setYears] = useState(5)
  const [rate, setRate] = useState(7.5)

  const { weekly, monthly, total } = useMemo(
    () => calcRepayments(amount, years, rate),
    [amount, years, rate]
  )

  return (
    <section id="calculator" className="py-16 bg-sand-50">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display text-4xl text-forest-900 mb-3">Repayment Calculator</h2>
          <p className="text-gray-500">Indicative estimates — actual rate depends on your credit profile and lender.</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <div className="grid md:grid-cols-3 gap-8 mb-10">
            {/* Loan amount */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-semibold text-gray-700">Loan Amount</label>
                <span className="text-sm font-bold text-forest-700">{formatAUD(amount)}</span>
              </div>
              <input
                type="range" min={30000} max={200000} step={5000} value={amount}
                onChange={e => setAmount(Number(e.target.value))}
                className="w-full accent-forest-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>$30k</span><span>$200k</span>
              </div>
            </div>

            {/* Term */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-semibold text-gray-700">Loan Term</label>
                <span className="text-sm font-bold text-forest-700">{years} {years === 1 ? 'year' : 'years'}</span>
              </div>
              <input
                type="range" min={1} max={7} step={1} value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full accent-forest-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>1 yr</span><span>7 yrs</span>
              </div>
            </div>

            {/* Interest rate */}
            <div>
              <div className="flex justify-between items-baseline mb-2">
                <label className="text-sm font-semibold text-gray-700">Interest Rate</label>
                <span className="text-sm font-bold text-forest-700">{rate.toFixed(1)}% p.a.</span>
              </div>
              <input
                type="range" min={5} max={15} step={0.1} value={rate}
                onChange={e => setRate(Number(e.target.value))}
                className="w-full accent-forest-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1.5">
                <span>5%</span><span>15%</span>
              </div>
            </div>
          </div>

          {/* Results */}
          <div className="grid grid-cols-3 bg-forest-950 rounded-xl overflow-hidden text-white text-center">
            <div className="px-4 py-6">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Weekly</p>
              <p className="font-display text-2xl md:text-3xl text-sand-400">{formatAUD(weekly)}</p>
            </div>
            <div className="px-4 py-6 border-x border-white/10">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Monthly</p>
              <p className="font-display text-2xl md:text-3xl">{formatAUD(monthly)}</p>
            </div>
            <div className="px-4 py-6">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2">Total Repayable</p>
              <p className="font-display text-2xl md:text-3xl">{formatAUD(total)}</p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Does not include establishment fees, account-keeping fees, or lender-specific charges. Comparison rate may vary.
          </p>
        </div>
      </div>
    </section>
  )
}
