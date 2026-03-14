'use client'

import { useState, useMemo } from 'react'

const COMPLIANCE = 2200
const SHIPPING_LWB = 2600
const SHIPPING_SLWB = 3200
const REG_MIN = 500
const REG_MAX = 1000
const DUTY_RATE = 0.05

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

export default function ImportCalculator() {
  const [vanAud, setVanAud] = useState(18000)
  const [size, setSize] = useState<'LWB' | 'SLWB'>('LWB')

  const shipping = size === 'SLWB' ? SHIPPING_SLWB : SHIPPING_LWB
  const duty = Math.round(vanAud * DUTY_RATE)
  const totalMin = vanAud + duty + shipping + COMPLIANCE + REG_MIN
  const totalMax = vanAud + duty + shipping + COMPLIANCE + REG_MAX

  const rows = useMemo(() => [
    { label: 'Japan van purchase', value: fmt(vanAud), note: 'Bid price or buy-now price' },
    { label: 'Import duty (5%)', value: fmt(duty), note: 'Applied to purchase price' },
    { label: 'RORO shipping', value: size === 'LWB' ? `${fmt(SHIPPING_LWB)}` : `${fmt(SHIPPING_SLWB)}`, note: `${size} Hiace — roll-on/roll-off` },
    { label: 'Compliance & ADR', value: `~${fmt(COMPLIANCE)}`, note: 'Includes inspection (included in sourcing fee)' },
    { label: 'Registration', value: `${fmt(REG_MIN)} – ${fmt(REG_MAX)}`, note: 'Varies by state' },
  ], [vanAud, duty, size])

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
      {/* Inputs */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Van purchase price (AUD)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min={8000}
                max={60000}
                step={500}
                value={vanAud}
                onChange={e => setVanAud(Number(e.target.value))}
                className="flex-1 accent-forest-600"
              />
              <span className="font-display text-forest-700 text-lg w-28 text-right">{fmt(vanAud)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>$8,000</span><span>$60,000</span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hiace size</label>
            <div className="flex gap-3">
              {(['LWB', 'SLWB'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-semibold transition-colors ${
                    size === s ? 'border-forest-600 bg-forest-50 text-forest-800' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {s}
                  <span className="block text-xs font-normal mt-0.5">
                    {s === 'LWB' ? 'Standard' : 'Super Long'}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Cost rows */}
      <div>
        {rows.map((row, i) => (
          <div key={row.label} className={`flex items-center justify-between px-6 py-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
            <div>
              <p className="text-sm font-medium text-gray-800">{row.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{row.note}</p>
            </div>
            <span className="font-semibold text-gray-900 text-sm shrink-0 ml-4">{row.value}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="px-6 py-4 bg-forest-950 text-white flex items-center justify-between">
        <div>
          <p className="font-display text-lg">Estimated Total on Australian Roads</p>
          <p className="text-white/60 text-xs mt-0.5">Excluding fit-out. Registration at lower estimate.</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl text-sand-400">
            {fmt(totalMin)} – {fmt(totalMax)}
          </p>
          <p className="text-white/50 text-xs mt-0.5">AUD estimate</p>
        </div>
      </div>

      <div className="px-6 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-800">
        Exchange rate fluctuations affect the JPY → AUD purchase price. The AUD estimate above uses your slider value — final price depends on the rate at time of payment.
      </div>
    </div>
  )
}
