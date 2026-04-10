'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

const SOURCING_FEE = 2750  // $2,500 + GST
const SHIPPING = 2500
const CUSTOMS_ENTRY = 110
const BMSB = 250
const GST_RATE = 0.10

const COMPLIANCE_BY_STATE: Record<string, number> = {
  QLD: 1800,
  NSW: 2000,
  VIC: 2200,
  WA: 2000,
}

const ADDONS = [
  { id: 'poptop',   label: 'Pop top roof conversion',     cost: 13090 },
  { id: 'hitop',    label: 'Hi-top roof conversion',      cost: 15090 },
  { id: 'fitout',   label: 'Basic fit-out (estimate)',     cost: 8000  },
  { id: 'mana',     label: 'Full turnkey build — MANA',   cost: 45000 },
]

function fmt(n: number) {
  return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(n)
}

function fmtJpy(n: number) {
  return '¥' + new Intl.NumberFormat('en-AU', { maximumFractionDigits: 0 }).format(n)
}

export default function ImportCalculator() {
  const [jpyPrice, setJpyPrice] = useState(2000000)
  const [exchangeRate, setExchangeRate] = useState(105)
  const [state, setState] = useState('QLD')
  const [addons, setAddons] = useState<Set<string>>(new Set())

  const compliance = COMPLIANCE_BY_STATE[state] ?? 1800

  const calc = useMemo(() => {
    const vehicleAud = Math.round(jpyPrice / exchangeRate)
    const landedValue = vehicleAud + SHIPPING
    const gst = Math.round(landedValue * GST_RATE)
    const subtotal = vehicleAud + SOURCING_FEE + SHIPPING + gst + CUSTOMS_ENTRY + BMSB + compliance
    const addonTotal = ADDONS.filter(a => addons.has(a.id)).reduce((sum, a) => sum + a.cost, 0)
    const total = subtotal + addonTotal

    // Dealer comparison: 1.20–1.35× the base landed+complied cost
    const dealerLow = Math.round(subtotal * 1.20)
    const dealerHigh = Math.round(subtotal * 1.35)
    const savingLow = dealerLow - subtotal
    const savingHigh = dealerHigh - subtotal

    return { vehicleAud, gst, subtotal, total, addonTotal, dealerLow, dealerHigh, savingLow, savingHigh }
  }, [jpyPrice, exchangeRate, state, compliance, addons])

  const toggleAddon = (id: string) => {
    setAddons(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">

      {/* ── Inputs ── */}
      <div className="p-6 bg-gray-50 border-b border-gray-200">
        <div className="grid md:grid-cols-3 gap-6">

          {/* JPY slider */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Auction price (JPY)
              <span className="ml-2 text-ocean font-bold text-lg">{fmtJpy(jpyPrice)}</span>
              <span className="ml-2 text-gray-400 font-normal text-sm">≈ {fmt(Math.round(jpyPrice / exchangeRate))} AUD</span>
            </label>
            <input
              type="range"
              min={500000}
              max={5000000}
              step={50000}
              value={jpyPrice}
              onChange={e => setJpyPrice(Number(e.target.value))}
              className="w-full accent-ocean"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              <span>¥500,000</span><span>¥5,000,000</span>
            </div>
          </div>

          {/* Exchange rate + State */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Exchange rate (JPY / AUD)
              </label>
              <input
                type="number"
                min={70}
                max={150}
                step={0.5}
                value={exchangeRate}
                onChange={e => setExchangeRate(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                Destination state
              </label>
              <select
                value={state}
                onChange={e => setState(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ocean/30 focus:border-ocean bg-white"
              >
                {Object.keys(COMPLIANCE_BY_STATE).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Cost breakdown ── */}
      <div>
        {[
          { label: `Vehicle (${fmtJpy(jpyPrice)} @ ${exchangeRate})`, value: fmt(calc.vehicleAud), note: 'Actual auction price, converted at current rate' },
          { label: 'Japan Import Service Fee ($2,500 + GST)', value: fmt(SOURCING_FEE), note: 'One fee covers both sides — our Japan buyer\'s agent and Australian broker. Only campervan brand with our own team in JP, AU & NZ.' },
          { label: 'Shipping (Yokohama → Brisbane)', value: fmt(SHIPPING), note: 'RORO ocean freight incl. pre-clean & quarantine prep' },
          { label: 'GST (10% on landed value)', value: fmt(calc.gst), note: '10% on vehicle + shipping. 0% import duty (JEPA free trade)' },
          { label: 'Customs entry + BMSB heat treatment', value: fmt(CUSTOMS_ENTRY + BMSB), note: `Entry fee $110 + quarantine heat treatment $250` },
          { label: `Compliance (${state})`, value: `~${fmt(compliance)}`, note: 'RAWS workshop — roadworthy, safety cert, compliance plate' },
        ].map((row, i) => (
          <div key={row.label} className={`flex items-center justify-between px-6 py-3.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
            <div>
              <p className="text-sm font-medium text-gray-800">{row.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{row.note}</p>
            </div>
            <span className="font-semibold text-gray-900 text-sm shrink-0 ml-4">{row.value}</span>
          </div>
        ))}
      </div>

      {/* ── Add-ons ── */}
      <div className="px-6 py-5 border-t border-gray-100 bg-cream/30">
        <p className="text-sm font-semibold text-gray-700 mb-3">Optional add-ons</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {ADDONS.map(a => (
            <label key={a.id} className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={addons.has(a.id)}
                onChange={() => toggleAddon(a.id)}
                className="w-4 h-4 accent-ocean rounded"
              />
              <span className="text-sm text-gray-700 group-hover:text-charcoal flex-1">{a.label}</span>
              <span className="text-sm font-semibold text-ocean">+{fmt(a.cost)}</span>
            </label>
          ))}
        </div>
      </div>

      {/* ── Total ── */}
      <div className="px-6 py-5 bg-charcoal text-white">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-lg font-semibold">Estimated total — landed & complied</p>
            {calc.addonTotal > 0 && (
              <p className="text-white/50 text-xs mt-0.5">Includes {fmt(calc.addonTotal)} in add-ons</p>
            )}
          </div>
          <p className="text-2xl font-bold text-sand">{fmt(calc.total)}</p>
        </div>

        {/* Dealer comparison */}
        <div className="border-t border-white/10 pt-3 mt-3 grid sm:grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl px-4 py-3">
            <p className="text-xs text-white/50 mb-1">Typical dealer price (same quality van)</p>
            <p className="text-white font-semibold">{fmt(calc.dealerLow)} – {fmt(calc.dealerHigh)}</p>
          </div>
          <div className="bg-ocean/20 rounded-xl px-4 py-3">
            <p className="text-xs text-ocean-light mb-1">Your estimated saving</p>
            <p className="text-ocean-light font-bold text-lg">{fmt(calc.savingLow)} – {fmt(calc.savingHigh)}</p>
          </div>
        </div>
      </div>

      {/* ── CTA + disclaimer ── */}
      <div className="px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border-t border-gray-100">
        <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
          Estimates only. Final costs depend on exchange rate at time of purchase, vehicle weight, and actual compliance requirements.{' '}
          <Link href="/contact" className="text-ocean hover:underline">Contact us for a firm quote.</Link>
        </p>
        <a
          href="https://wa.me/61432182892?text=Hi!%20I'm%20interested%20in%20importing%20a%20Hiace%20through%20Bare%20Camper."
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary shrink-0 px-6 py-3 text-sm"
        >
          Get Started — Free Chat
        </a>
      </div>
    </div>
  )
}
